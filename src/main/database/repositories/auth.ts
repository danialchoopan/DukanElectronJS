/**
 * Auth repository — user management with RBAC support.
 *
 * Manages user CRUD, login, PIN management, and role/permission assignment.
 * Supports roles: admin, cashier, manager, accountant, salesperson, warehouse, viewer.
 * Tracks last login and last activity timestamps.
 */

import { getDatabase, hashPin } from '../connection'
import type { User } from '../../../types'

export function login(pinCode: string): User | undefined {
  const db = getDatabase()
  const hashed = hashPin(pinCode)
  const row = db.prepare(
    'SELECT id, name, pin_code, role, permissions, lastLoginAt, lastActivityAt, isActive, createdAt FROM users WHERE pin_code = ? AND isActive = 1'
  ).get(hashed) as Record<string, unknown> | undefined
  if (row) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    db.prepare("UPDATE users SET lastLoginAt = ?, lastActivityAt = ? WHERE id = ?").run(now, now, row.id as number)
    return formatUser(row)
  }
  return undefined
}

export function touchActivity(userId: number): void {
  const db = getDatabase()
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.prepare("UPDATE users SET lastActivityAt = ? WHERE id = ?").run(now, userId)
}

export function getAllUsers(): User[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT id, name, pin_code, role, permissions, lastLoginAt, lastActivityAt, isActive, createdAt FROM users WHERE isActive = 1 ORDER BY name'
  ).all() as Record<string, unknown>[]
  return rows.map(formatUser)
}

export function getAllUsersIncludingInactive(): User[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT id, name, pin_code, role, permissions, lastLoginAt, lastActivityAt, isActive, createdAt FROM users ORDER BY isActive DESC, name'
  ).all() as Record<string, unknown>[]
  return rows.map(formatUser)
}

export function getUserById(id: number): User | undefined {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT id, name, pin_code, role, permissions, lastLoginAt, lastActivityAt, isActive, createdAt FROM users WHERE id = ?'
  ).get(id) as Record<string, unknown> | undefined
  return row ? formatUser(row) : undefined
}

export function createUser(name: string, pinCode: string, role: string = 'cashier'): User {
  const db = getDatabase()
  const hashed = hashPin(pinCode)
  const result = db.prepare(
    'INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)'
  ).run(name, hashed, role)
  const row = db.prepare(
    'SELECT id, name, pin_code, role, permissions, lastLoginAt, lastActivityAt, isActive, createdAt FROM users WHERE id = ?'
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

export function updateUser(id: number, data: { name?: string; pinCode?: string; role?: string; permissions?: string }): boolean {
  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return false
  const newName = data.name ?? existing.name as string
  const newRole = data.role ?? existing.role as string
  const newPerms = data.permissions ?? existing.permissions as string
  if (data.pinCode && data.pinCode.length >= 4) {
    const hashed = hashPin(data.pinCode)
    db.prepare('UPDATE users SET name = ?, role = ?, permissions = ?, pin_code = ? WHERE id = ?').run(newName, newRole, newPerms, hashed, id)
  } else {
    db.prepare('UPDATE users SET name = ?, role = ?, permissions = ? WHERE id = ?').run(newName, newRole, newPerms, id)
  }
  return true
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
    role: (row.role as string) as User['role'],
    permissions: (row.permissions as string) ?? '{}',
    lastLoginAt: (row.lastLoginAt as string) ?? '',
    lastActivityAt: (row.lastActivityAt as string) ?? '',
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt as string,
  }
}
