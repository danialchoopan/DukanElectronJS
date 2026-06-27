/**
 * Settings repository — key-value store for app configuration.
 *
 * All settings are stored as text in the `settings` table.
 * Use getSetting/setSetting for individual values.
 * Use getAll to retrieve all settings as a single object.
 *
 * Common keys: taxRate, taxEnabled, storeName, storePhone, storeAddress,
 * autoBackupEnabled, autoBackupInterval, theme, language, etc.
 */

import { getDatabase } from '../connection'

export function getSetting(key: string): string | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase()
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getAutoRounding(): number {
  return parseInt(getSetting('autoRounding') ?? '500', 10)
}

export function getAllSettings(): Record<string, string> {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}
