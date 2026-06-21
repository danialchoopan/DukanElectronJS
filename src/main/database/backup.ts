import { app } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, readdirSync, unlinkSync, statSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'

const BACKUP_DIR = join(app.getPath('userData'), 'backups')
const DB_PATH = join(app.getPath('userData'), 'pos.db')
const WAL_PATH = join(app.getPath('userData'), 'pos.db-wal')
const SHM_PATH = join(app.getPath('userData'), 'pos.db-shm')

function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })
}

function fileHash(filePath: string): string {
  const data = readFileSync(filePath)
  return createHash('sha256').update(data).digest('hex')
}

export function createBackup(label?: string): { success: boolean; path?: string; hash?: string; size?: number; error?: string } {
  try {
    ensureBackupDir()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const name = label ? `${label}-${timestamp}` : `backup-${timestamp}`
    const dbCopy = join(BACKUP_DIR, `${name}.db`)
    const walCopy = join(BACKUP_DIR, `${name}.db-wal`)
    const shmCopy = join(BACKUP_DIR, `${name}.db-shm`)

    copyFileSync(DB_PATH, dbCopy)
    if (existsSync(WAL_PATH)) copyFileSync(WAL_PATH, walCopy)
    if (existsSync(SHM_PATH)) copyFileSync(SHM_PATH, shmCopy)

    const hash = fileHash(dbCopy)
    const size = statSync(dbCopy).size

    const meta = { name, hash, size, timestamp: new Date().toISOString(), appVersion: app.getVersion(), label: label || 'auto', tables: getTableStats() }
    writeFileSync(join(BACKUP_DIR, `${name}.meta.json`), JSON.stringify(meta, null, 2))

    return { success: true, path: dbCopy, hash, size }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function checkIntegrity(dbPath?: string): { success: boolean; integrityCheck?: string; foreignKeyCheck?: string; tableCount?: number; error?: string } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3')
    const checkDb = new Database(dbPath || DB_PATH, { readonly: true })
    checkDb.pragma('foreign_keys = ON')

    const integrity = checkDb.pragma('integrity_check')[0]?.integrity_check || 'unknown'
    const fkCheck = checkDb.pragma('foreign_key_check')
    const tables = checkDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()

    checkDb.close()

    return {
      success: integrity === 'ok',
      integrityCheck: integrity,
      foreignKeyCheck: fkCheck.length === 0 ? 'ok' : `${fkCheck.length} violations`,
      tableCount: tables.length,
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function verifyBackup(backupPath: string): { success: boolean; hashMatch?: boolean; error?: string } {
  try {
    if (!existsSync(backupPath)) return { success: false, error: 'Backup file not found' }
    const backupHash = fileHash(backupPath)
    const sourceHash = fileHash(DB_PATH)
    return { success: true, hashMatch: backupHash === sourceHash }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function restoreBackup(backupPath: string): { success: boolean; error?: string } {
  try {
    if (!existsSync(backupPath)) return { success: false, error: 'Backup file not found' }

    const check = checkIntegrity(backupPath)
    if (!check.success) return { success: false, error: `Backup integrity failed: ${check.error || check.integrityCheck}` }

    createBackup('pre-restore')

    copyFileSync(backupPath, DB_PATH)

    const walPath = backupPath.replace('.db', '.db-wal')
    const shmPath = backupPath.replace('.db', '.db-shm')
    if (existsSync(walPath)) copyFileSync(walPath, WAL_PATH)
    if (existsSync(shmPath)) copyFileSync(shmPath, SHM_PATH)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function listBackups(): { name: string; path: string; size: number; timestamp: string; hash: string }[] {
  ensureBackupDir()
  const files = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.meta.json'))
  return files.map(f => {
    const meta = JSON.parse(readFileSync(join(BACKUP_DIR, f), 'utf-8'))
    return { name: meta.name, path: join(BACKUP_DIR, `${meta.name}.db`), size: meta.size, timestamp: meta.timestamp, hash: meta.hash }
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function getTableStats(dbPath?: string): Record<string, number> {
  try {
    const Database = require('better-sqlite3')
    const targetDb = new Database(dbPath || DB_PATH, { readonly: true })
    const tables = targetDb.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]
    const stats: Record<string, number> = {}
    for (const t of tables) {
      const row = targetDb.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get() as { count: number }
      stats[t.name] = row.count
    }
    targetDb.close()
    return stats
  } catch {
    return {}
  }
}

export function checkBackupVersion(backupPath: string): { compatible: boolean; backupVersion: string; currentVersion: string; message: string; meta?: any } {
  try {
    const metaPath = backupPath.replace('.db', '.meta.json')
    if (!existsSync(metaPath)) {
      return { compatible: false, backupVersion: 'unknown', currentVersion: app.getVersion(), message: 'Backup metadata not found (created by older version). Compatibility unknown.', meta: null }
    }
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    return {
      compatible: true,
      backupVersion: meta.appVersion || 'unknown',
      currentVersion: app.getVersion(),
      message: `Backup created with version ${meta.appVersion || 'unknown'}. Current version: ${app.getVersion()}`,
      meta,
    }
  } catch (err) {
    return { compatible: false, backupVersion: 'unknown', currentVersion: app.getVersion(), message: err instanceof Error ? err.message : String(err), meta: null }
  }
}

export function getBackupDetails(backupPath: string): { success: boolean; data?: { meta: any; tables: Record<string, number>; integrity: any }; error?: string } {
  try {
    const metaPath = backupPath.replace('.db', '.meta.json')
    const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : null
    const tables = getTableStats(backupPath)
    const integrity = checkIntegrity(backupPath)
    return { success: true, data: { meta, tables, integrity } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function autoBackup(): { created: boolean; path?: string } {
  ensureBackupDir()
  const today = new Date().toISOString().slice(0, 10)
  const existing = readdirSync(BACKUP_DIR).filter(f => f.includes(today))
  if (existing.length > 0) return { created: false }
  const result = createBackup('auto')
  return { created: result.success, path: result.path }
}

export function cleanupBackups(keepCount: number = 30): { deleted: number } {
  ensureBackupDir()
  const backups = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.meta.json'))
  if (backups.length <= keepCount) return { deleted: 0 }
  const sorted = backups.sort().reverse()
  const toDelete = sorted.slice(keepCount)
  for (const f of toDelete) {
    const name = f.replace('.meta.json', '')
    try {
      unlinkSync(join(BACKUP_DIR, `${name}.db`))
      unlinkSync(join(BACKUP_DIR, f))
      const wal = join(BACKUP_DIR, `${name}.db-wal`)
      const shm = join(BACKUP_DIR, `${name}.db-shm`)
      if (existsSync(wal)) unlinkSync(wal)
      if (existsSync(shm)) unlinkSync(shm)
    } catch(e) { /* ignore */ }
  }
  return { deleted: toDelete.length }
}

export function getBackupStats(): { totalBackups: number; latestBackup: string | null; totalSize: number } {
  ensureBackupDir()
  const files = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'))
  const totalSize = files.reduce((sum, f) => sum + statSync(join(BACKUP_DIR, f)).size, 0)
  const latest = files.sort().pop() || null
  return { totalBackups: files.length, latestBackup: latest, totalSize }
}
