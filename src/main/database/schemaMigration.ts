/**
 * Schema Migration — handles incremental database schema upgrades.
 *
 * On every startup:
 *   1. Read current schema_version from settings table
 *   2. Compare against CURRENT_VERSION
 *   3. Run pending migrations in order
 *   4. Record each migration in migration_history table
 *   5. Update schema_version setting
 *
 * Each migration is an atomic transaction with rollback on failure.
 * Pre-migration backup is created automatically.
 */

import { getDatabase } from './connection'
import { createBackup } from './backup'

const CURRENT_VERSION = '1.5.0'

// Expose for external use
export { CURRENT_VERSION }

interface Migration {
  version: string
  description: string
  up: (db: any) => void
  down: (db: any) => void
}

/**
 * All migration scripts in order.
 * Each migration transforms the schema from the previous version.
 */
const MIGRATIONS: Migration[] = [
  {
    version: '1.0.0',
    description: 'نقطه شروع — ساختار پایه دیتابیس',
    up: () => {},
    down: () => {},
  },
  {
    version: '1.1.0',
    description: 'افزودن زیردسته و وضعیت فروش به محصولات',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(products)').all().map((c: any) => c.name)
      if (!cols.includes('subcategory')) db.exec("ALTER TABLE products ADD COLUMN subcategory TEXT DEFAULT ''")
      if (!cols.includes('isSellable')) db.exec("ALTER TABLE products ADD COLUMN isSellable INTEGER DEFAULT 1")
    },
    down: (_db) => {
      // SQLite does not support DROP COLUMN, so we skip rollback
    },
  },
  {
    version: '1.2.0',
    description: 'افزودن تاریخ فاکتور و تأثیر بر موجودی به فروش‌ها',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(sales)').all().map((c: any) => c.name)
      if (!cols.includes('saleDate')) db.exec("ALTER TABLE sales ADD COLUMN saleDate TEXT DEFAULT datetime('now', 'localtime')")
      if (!cols.includes('affectsInventory')) db.exec("ALTER TABLE sales ADD COLUMN affectsInventory INTEGER DEFAULT 1")
    },
    down: () => {},
  },
  {
    version: '1.3.0',
    description: 'افزودن اصلاح موجودی و مسدودی مشتری',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(customers)').all().map((c: any) => c.name)
      if (!cols.includes('is_blocked')) db.exec("ALTER TABLE customers ADD COLUMN is_blocked INTEGER DEFAULT 0")
    },
    down: () => {},
  },
  {
    version: '1.4.0',
    description: 'افزودن جداول جدید: cross_sell_rules, installments, proformas, service_tickets, customer_credit',
    up: () => {},
    down: () => {},
  },
  {
    version: '1.5.0',
    description: 'افزودن نقش‌های جدید کاربر، لاگ تقویت‌شده، و نقاط بازیابی',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(users)').all().map((c: any) => c.name)
      if (!cols.includes('permissions')) db.exec("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'")
      if (!cols.includes('lastLoginAt')) db.exec("ALTER TABLE users ADD COLUMN lastLoginAt TEXT DEFAULT ''")
      if (!cols.includes('lastActivityAt')) db.exec("ALTER TABLE users ADD COLUMN lastActivityAt TEXT DEFAULT ''")

      const auditCols = db.prepare('PRAGMA table_info(audit_log)').all().map((c: any) => c.name)
      if (!auditCols.includes('userName')) db.exec("ALTER TABLE audit_log ADD COLUMN userName TEXT DEFAULT ''")
      if (!auditCols.includes('beforeValue')) db.exec("ALTER TABLE audit_log ADD COLUMN beforeValue TEXT DEFAULT ''")
      if (!auditCols.includes('afterValue')) db.exec("ALTER TABLE audit_log ADD COLUMN afterValue TEXT DEFAULT ''")
      if (!auditCols.includes('ip')) db.exec("ALTER TABLE audit_log ADD COLUMN ip TEXT DEFAULT ''")
    },
    down: () => {},
  },
]

/** Get current schema version from settings table. */
export function getSchemaVersion(): string {
  const db = getDatabase()
  const row = db.prepare("SELECT value FROM settings WHERE key = 'schemaVersion'").get() as { value: string } | undefined
  return row?.value || '0.0.0'
}

/** Set schema version in settings table. */
function setSchemaVersion(version: string): void {
  const db = getDatabase()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('schemaVersion', ?)").run(version)
}

/** Get all pending migrations from current version to latest. */
function getPendingMigrations(): Migration[] {
  const current = getSchemaVersion()
  return MIGRATIONS.filter(m => m.version > current)
}

/**
 * Run all pending migrations. Creates a backup before starting.
 * Returns { success, applied, errors }.
 */
export function runMigrations(): { success: boolean; applied: string[]; errors: string[] } {
  const pending = getPendingMigrations()
  if (pending.length === 0) return { success: true, applied: [], errors: [] }

  const db = getDatabase()
  const applied: string[] = []
  const errors: string[] = []

  // Pre-migration backup
  try {
    createBackup('pre-migration')
  } catch (e) {
    console.warn('[Migration] Pre-backup failed:', e)
  }

  for (const migration of pending) {
    try {
      console.log(`[Migration] Running ${migration.version}: ${migration.description}`)
      db.transaction(() => { migration.up(db) })()

      // Record in migration_history
      db.prepare(`INSERT INTO migration_history (fromVersion, toVersion, description, status) VALUES (?, ?, ?, 'applied')`)
        .run(getSchemaVersion(), migration.version, migration.description)

      setSchemaVersion(migration.version)
      applied.push(migration.version)
      console.log(`[Migration] ${migration.version} applied successfully`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${migration.version}: ${msg}`)
      console.error(`[Migration] ${migration.version} FAILED:`, msg)

      // Record failure
      try {
        db.prepare(`INSERT INTO migration_history (fromVersion, toVersion, description, status, errorMessage) VALUES (?, ?, ?, 'failed', ?)`)
          .run(getSchemaVersion(), migration.version, migration.description, msg)
      } catch {}

      break // Stop on first failure
    }
  }

  return { success: errors.length === 0, applied, errors }
}

/**
 * Dry-run: check what migrations would be applied without actually running them.
 */
export function dryRunMigrations(): { currentVersion: string; pending: { version: string; description: string }[]; wouldNeedBackup: boolean } {
  const current = getSchemaVersion()
  const pending = getPendingMigrations()
  return {
    currentVersion: current,
    pending: pending.map(m => ({ version: m.version, description: m.description })),
    wouldNeedBackup: pending.length > 0,
  }
}

/**
 * Get migration history from the migration_history table.
 */
export function getMigrationHistory(): any[] {
  const db = getDatabase()
  // Ensure table exists
  db.exec(`CREATE TABLE IF NOT EXISTS migration_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromVersion TEXT NOT NULL,
    toVersion TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'applied',
    errorMessage TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  )`)
  return db.prepare('SELECT * FROM migration_history ORDER BY id ASC').all()
}

/**
 * Validate database integrity after migration.
 */
export function validateAfterMigration(): { valid: boolean; issues: string[] } {
  const db = getDatabase()
  const issues: string[] = []

  try {
    const integrity = db.pragma('integrity_check') as any
    if (integrity && integrity.integrity_check !== 'ok') issues.push('Integrity check failed')
  } catch (e) { issues.push(`Integrity check error: ${e}`) }

  try {
    const fkCheck = db.pragma('foreign_key_check') as any
    if (fkCheck && fkCheck.foreign_key_check !== 'ok') issues.push('Foreign key check failed')
  } catch {}

  // Check critical tables exist
  const requiredTables = ['users', 'products', 'customers', 'sales', 'accounts', 'settings', 'audit_log']
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
  const tableNames = new Set(tables.map(t => t.name))
  for (const t of requiredTables) {
    if (!tableNames.has(t)) issues.push(`Missing table: ${t}`)
  }

  return { valid: issues.length === 0, issues }
}
