import { getDatabase, hashPin } from '../connection'
import type { User } from '../../../types'

export function login(pinCode: string): User | undefined {
  const db = getDatabase()
  const hashed = hashPin(pinCode)
  const row = db.prepare(
    'SELECT id, name, pin_code, role, isActive, createdAt FROM users WHERE pin_code = ? AND isActive = 1'
  ).get(hashed) as Record<string, unknown> | undefined
  return row ? formatUser(row) : undefined
}

export function getAllUsers(): User[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT id, name, pin_code, role, isActive, createdAt FROM users WHERE isActive = 1 ORDER BY name'
  ).all() as Record<string, unknown>[]
  return rows.map(formatUser)
}

export function createUser(name: string, pinCode: string, role: 'admin' | 'cashier'): User {
  const db = getDatabase()
  const hashed = hashPin(pinCode)
  const result = db.prepare(
    'INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)'
  ).run(name, hashed, role)
  const row = db.prepare(
    'SELECT id, name, pin_code, role, isActive, createdAt FROM users WHERE id = ?'
  ).get(result.lastInsertRowid) as Record<string, unknown>
  return formatUser(row)
}

export function deleteUser(id: number): boolean {
  const db = getDatabase()
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as { role: string } | undefined
  if (!user || user.role === 'admin') return false
  const result = db.prepare('UPDATE users SET isActive = 0 WHERE id = ?').run(id)
  return result.changes > 0
}

export function changePin(id: number, newPin: string): boolean {
  const db = getDatabase()
  const hashed = hashPin(newPin)
  const result = db.prepare('UPDATE users SET pin_code = ? WHERE id = ?').run(hashed, id)
  return result.changes > 0
}

function formatUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    name: row.name as string,
    pin_code: row.pin_code as string,
    role: row.role as 'admin' | 'cashier',
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt as string,
  }
}
