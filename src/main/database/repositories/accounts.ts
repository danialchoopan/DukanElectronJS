import { getDatabase } from '../connection'
import type { Account, CreateAccountInput, AccountTreeNode, AccountType } from '../../../types'

export function getAllAccounts(): Account[] {
  return getDatabase().prepare('SELECT * FROM accounts ORDER BY code').all() as Account[]
}

export function getAccountsByType(type: AccountType): Account[] {
  return getDatabase().prepare('SELECT * FROM accounts WHERE type = ? ORDER BY code').all(type) as Account[]
}

export function getAccountById(id: number): Account | undefined {
  return getDatabase().prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined
}

export function getAccountByCode(code: string): Account | undefined {
  return getDatabase().prepare('SELECT * FROM accounts WHERE code = ?').get(code) as Account | undefined
}

export function getAccountTree(): AccountTreeNode[] {
  const all = getAllAccounts()
  const map = new Map<number, AccountTreeNode>()
  const roots: AccountTreeNode[] = []
  for (const a of all) map.set(a.id, { account: a, children: [] })
  for (const a of all) {
    const node = map.get(a.id)!
    if (a.parentId && map.has(a.parentId)) {
      map.get(a.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export function createAccount(data: CreateAccountInput): Account {
  const db = getDatabase()
  const r = db.prepare('INSERT INTO accounts (code, name, type, parentId, description) VALUES (?, ?, ?, ?, ?)').run(
    data.code, data.name, data.type, data.parentId ?? null, data.description ?? ''
  )
  return getAccountById(r.lastInsertRowid as number)!
}

export function updateAccount(id: number, data: Partial<CreateAccountInput>): Account | undefined {
  const db = getDatabase()
  const fields: string[] = []
  const vals: any[] = []
  if (data.code !== undefined) { fields.push('code = ?'); vals.push(data.code) }
  if (data.name !== undefined) { fields.push('name = ?'); vals.push(data.name) }
  if (data.type !== undefined) { fields.push('type = ?'); vals.push(data.type) }
  if (data.parentId !== undefined) { fields.push('parentId = ?'); vals.push(data.parentId) }
  if (data.description !== undefined) { fields.push('description = ?'); vals.push(data.description) }
  if (fields.length === 0) return getAccountById(id)
  vals.push(id)
  db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
  return getAccountById(id)
}

export function deleteAccount(id: number): boolean {
  const db = getDatabase()
  const hasChildren = db.prepare('SELECT COUNT(*) as c FROM accounts WHERE parentId = ?').get(id) as { c: number }
  if (hasChildren.c > 0) return false
  const hasTransactions = db.prepare('SELECT COUNT(*) as c FROM journal_entry_lines WHERE accountId = ?').get(id) as { c: number }
  if (hasTransactions.c > 0) {
    db.prepare('UPDATE accounts SET isActive = 0 WHERE id = ?').run(id)
    return true
  }
  db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
  return true
}

export function toggleAccountActive(id: number): boolean {
  const db = getDatabase()
  db.prepare('UPDATE accounts SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
  return true
}
