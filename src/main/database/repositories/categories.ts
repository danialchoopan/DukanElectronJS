import { getDatabase } from '../connection'

export interface Category {
  id: number
  name: string
  parentId: number | null
  createdAt: string
}

export function getAllCategories(): Category[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[]
}

export function getParentCategories(): Category[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name').all() as Category[]
}

export function getSubcategories(parentId: number): Category[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories WHERE parent_id = ? ORDER BY name').all(parentId) as Category[]
}

export function getCategoryById(id: number): Category | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
}

export function createCategory(name: string, parentId?: number): Category {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)').run(name, parentId || null)
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
}

export function updateCategory(id: number, name: string): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id)
  return result.changes > 0
}

export function deleteCategory(id: number): boolean {
  const db = getDatabase()
  db.prepare('DELETE FROM categories WHERE parent_id = ?').run(id)
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  return result.changes > 0
}

export function getCategoryTree(): { id: number; name: string; children: { id: number; name: string }[] }[] {
  const parents = getParentCategories()
  return parents.map((p) => ({
    id: p.id,
    name: p.name,
    children: getSubcategories(p.id).map((s) => ({ id: s.id, name: s.name })),
  }))
}
