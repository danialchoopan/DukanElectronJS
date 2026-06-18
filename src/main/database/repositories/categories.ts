import { getDatabase } from '../connection'

export interface Category {
  id: number
  name: string
  slug: string
  parentId: number | null
  level: number
  isActive: boolean
  productCount?: number
  createdAt: string
}

export function getAllCategories(): Category[] {
  const db = getDatabase()
  const cats = db.prepare('SELECT *, is_active as isActive FROM categories ORDER BY level, name').all() as Category[]
  const counts = db.prepare('SELECT category, COUNT(*) as c FROM products WHERE isActive = 1 GROUP BY category').all() as { category: string; c: number }[]
  const countMap = new Map(counts.map(r => [r.category, r.c]))
  return cats.map(c => ({ ...c, productCount: countMap.get(c.name) || 0 }))
}

export function getParentCategories(): Category[] {
  return getAllCategories().filter(c => c.parentId === null)
}

export function getSubcategories(parentId: number): Category[] {
  return getAllCategories().filter(c => c.parentId === parentId)
}

export function getCategoryById(id: number): Category | undefined {
  const db = getDatabase()
  const cat = db.prepare('SELECT *, is_active as isActive FROM categories WHERE id = ?').get(id) as Category | undefined
  if (!cat) return undefined
  const count = db.prepare('SELECT COUNT(*) as c FROM products WHERE category = ? AND isActive = 1').get(cat.name) as { c: number }
  return { ...cat, productCount: count.c }
}

export function createCategory(name: string, parentId?: number): Category {
  const db = getDatabase()
  const slug = name.replace(/\s+/g, '-').toLowerCase()
  const level = parentId ? 1 : 0
  const result = db.prepare('INSERT INTO categories (name, slug, parent_id, level) VALUES (?, ?, ?, ?)').run(name, slug, parentId || null, level)
  return db.prepare('SELECT *, is_active as isActive FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
}

export function updateCategory(id: number, data: { name?: string; slug?: string; isActive?: boolean }): boolean {
  const db = getDatabase()
  const fields: string[] = []
  const vals: any[] = []
  if (data.name !== undefined) { fields.push('name = ?'); vals.push(data.name) }
  if (data.slug !== undefined) { fields.push('slug = ?'); vals.push(data.slug) }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); vals.push(data.isActive ? 1 : 0) }
  if (fields.length === 0) return false
  vals.push(id)
  const result = db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
  return result.changes > 0
}

export function toggleCategoryActive(id: number): boolean {
  const db = getDatabase()
  db.prepare('UPDATE categories SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
  return true
}

export function deleteCategory(id: number): { success: boolean; error?: string } {
  const db = getDatabase()
  const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as { name: string } | undefined
  if (!cat) return { success: false, error: 'دسته‌بندی یافت نشد' }
  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products WHERE category = ? AND isActive = 1').get(cat.name) as { c: number }).c
  if (productCount > 0) return { success: false, error: `${productCount} کالا در این دسته‌بندی وجود دارد. ابتدا کالاها را منتقل کنید.` }
  db.prepare('DELETE FROM categories WHERE parent_id = ?').run(id)
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  return { success: true }
}

export function getCategoryTree(): Category[] {
  const all = getAllCategories().filter(c => c.isActive)
  const parents = all.filter(c => c.parentId === null)
  return parents.map(p => ({
    ...p,
    children: all.filter(c => c.parentId === p.id)
  } as Category & { children: Category[] }))
}

export function getCategoryDescendantIds(id: number): number[] {
  const db = getDatabase()
  const ids = [id]
  const children = db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(id) as { id: number }[]
  for (const child of children) {
    ids.push(...getCategoryDescendantIds(child.id))
  }
  return ids
}
