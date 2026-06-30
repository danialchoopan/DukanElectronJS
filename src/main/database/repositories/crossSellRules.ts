/**
 * Cross-Sell Rules repository — mandatory/recommended product rules engine.
 *
 * Rule types:
 *   - product: trigger when specific product is in cart
 *   - category: trigger when any product from category is in cart
 *   - price: trigger when cart total exceeds threshold
 *   - quantity: trigger when any product quantity exceeds threshold
 *
 * Rule types (what to suggest):
 *   - mandatory: MUST add (auto-add to cart)
 *   - optional: show as suggestion
 *   - recommended: show as recommendation
 *
 * Priority: lower number = higher priority. First matching rule wins.
 */

import { getDatabase } from '../connection'

export interface CrossSellRule {
  id: number
  name: string
  triggerType: string
  triggerValue: string
  triggerCondition: string
  triggerThreshold: number
  ruleType: string
  priority: number
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  items?: CrossSellRuleItem[]
}

export interface CrossSellRuleItem {
  id: number
  ruleId: number
  productId: number
  productName?: string
  quantity: number
  discountPercent: number
}

function formatRule(row: Record<string, unknown>): CrossSellRule {
  return {
    id: row.id as number,
    name: row.name as string,
    triggerType: row.triggerType as string,
    triggerValue: (row.triggerValue as string) ?? '',
    triggerCondition: (row.triggerCondition as string) ?? '>=',
    triggerThreshold: (row.triggerThreshold as number) ?? 0,
    ruleType: row.ruleType as string,
    priority: (row.priority as number) ?? 0,
    isActive: (row.isActive as number) === 1,
    createdBy: (row.createdBy as string) ?? 'admin',
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }
}

export function getAllRules(): CrossSellRule[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM cross_sell_rules ORDER BY priority ASC').all() as Record<string, unknown>[]
  return rows.map(formatRule)
}

export function getRuleById(id: number): CrossSellRule | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM cross_sell_rules WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return undefined
  const rule = formatRule(row)
  rule.items = db.prepare(`
    SELECT csi.*, p.title as productName
    FROM cross_sell_rule_items csi
    JOIN products p ON csi.productId = p.id
    WHERE csi.ruleId = ?
  `).all(id) as CrossSellRuleItem[]
  return rule
}

export function createRule(data: {
  name: string; triggerType: string; triggerValue: string; triggerCondition?: string; triggerThreshold?: number; ruleType: string; priority?: number; createdBy?: string
}): CrossSellRule {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO cross_sell_rules (name, triggerType, triggerValue, triggerCondition, triggerThreshold, ruleType, priority, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.name, data.triggerType, data.triggerValue, data.triggerCondition || '>=', data.triggerThreshold || 0, data.ruleType, data.priority || 0, data.createdBy || 'admin')
  return getRuleById(result.lastInsertRowid as number)!
}

export function updateRule(id: number, data: Partial<CrossSellRule>): boolean {
  const db = getDatabase()
  const fields: string[] = []
  const vals: any[] = []
  if (data.name !== undefined) { fields.push('name = ?'); vals.push(data.name) }
  if (data.ruleType !== undefined) { fields.push('ruleType = ?'); vals.push(data.ruleType) }
  if (data.priority !== undefined) { fields.push('priority = ?'); vals.push(data.priority) }
  if (data.isActive !== undefined) { fields.push('isActive = ?'); vals.push(data.isActive ? 1 : 0) }
  if (data.triggerType !== undefined) { fields.push('triggerType = ?'); vals.push(data.triggerType) }
  if (data.triggerValue !== undefined) { fields.push('triggerValue = ?'); vals.push(data.triggerValue) }
  if (data.triggerCondition !== undefined) { fields.push('triggerCondition = ?'); vals.push(data.triggerCondition) }
  if (data.triggerThreshold !== undefined) { fields.push('triggerThreshold = ?'); vals.push(data.triggerThreshold) }
  if (fields.length === 0) return false
  fields.push("updatedAt = datetime('now', 'localtime')")
  vals.push(id)
  const result = db.prepare(`UPDATE cross_sell_rules SET ${fields.join(', ')} WHERE id = ?`).run(...vals)
  return result.changes > 0
}

export function deleteRule(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM cross_sell_rules WHERE id = ?').run(id)
  return result.changes > 0
}

export function addRuleItem(ruleId: number, productId: number, quantity: number = 1, discountPercent: number = 0): CrossSellRuleItem {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO cross_sell_rule_items (ruleId, productId, quantity, discountPercent) VALUES (?, ?, ?, ?)').run(ruleId, productId, quantity, discountPercent)
  return db.prepare('SELECT csr.*, p.title as productName FROM cross_sell_rules csr JOIN products p ON csr.productId = p.id WHERE csr.id = ?').get(result.lastInsertRowid) as CrossSellRuleItem
}

export function removeRuleItem(id: number): boolean {
  const db = getDatabase()
  return db.prepare('DELETE FROM cross_sell_rule_items WHERE id = ?').run(id).changes > 0
}

/**
 * Evaluate rules against a cart context and return triggered products.
 * @param cartProductIds - product IDs in the current cart
 * @param cartTotal - total cart value
 * @param cartCategories - categories in the cart
 * @returns triggered rule items (deduplicated by productId)
 */
export function evaluateRules(
  cartProductIds: number[], cartTotal: number, cartCategories: string[]
): { ruleType: string; productName: string; productId: number; quantity: number; discountPercent: number }[] {
  const db = getDatabase()
  const activeRules = db.prepare(
    'SELECT * FROM cross_sell_rules WHERE isActive = 1 ORDER BY priority ASC'
  ).all() as any[]

  const triggeredProducts = new Map<number, { ruleType: string; productName: string; productId: number; quantity: number; discountPercent: number }>()

  for (const rule of activeRules) {
    let matches = false

    switch (rule.triggerType) {
      case 'product':
        matches = cartProductIds.includes(rule.triggerValue)
        break
      case 'category':
        matches = cartCategories.includes(rule.triggerValue)
        break
      case 'price':
        matches = rule.triggerCondition === '>=' ? cartTotal >= rule.triggerThreshold : cartTotal <= rule.triggerThreshold
        break
      case 'quantity': {
        const maxQty = cartProductIds.length
        matches = rule.triggerCondition === '>=' ? maxQty >= rule.triggerThreshold : maxQty <= rule.triggerThreshold
        break
      }
    }

    if (matches) {
      const items = db.prepare(`
        SELECT csi.*, p.title as productName
        FROM cross_sell_rule_items csi
        JOIN products p ON csi.productId = p.id
        WHERE csi.ruleId = ?
      `).all(rule.id) as any[]

      for (const item of items) {
        if (!triggeredProducts.has(item.productId) || rule.ruleType === 'mandatory') {
          triggeredProducts.set(item.productId, {
            ruleType: rule.ruleType,
            productName: item.productName,
            productId: item.productId,
            quantity: item.quantity,
            discountPercent: item.discountPercent,
          })
        }
      }
    }
  }

  return Array.from(triggeredProducts.values())
}
