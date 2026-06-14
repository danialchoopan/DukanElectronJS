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
