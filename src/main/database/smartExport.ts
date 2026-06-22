import * as fs from 'fs'
import * as crypto from 'crypto'
import { getDatabase } from './connection'

const SIGNATURE_KEY = 'hesabdari-danial-export-2026'

export type DataModule = 'products' | 'customers' | 'categories' | 'users' | 'settings' | 'sales' | 'expenses' | 'returns' | 'accounts' | 'journal' | 'fiscal_periods' | 'cash_register'

export interface ExportOptions {
  modules: DataModule[]
  includeImages: boolean
  password?: string
}

export interface ImportOptions {
  modules: DataModule[]
  conflictResolution: 'replace' | 'skip' | 'merge'
  validate: boolean
  password?: string
}

export interface ModuleData {
  module: DataModule
  tables: Record<string, any[]>
  recordCount: number
}

export interface ExportResult {
  success: boolean
  filePath?: string
  data?: SmartExportPayload
  error?: string
}

export interface ImportResult {
  success: boolean
  recordsImported: Record<string, number>
  errors: ImportError[]
  warnings: string[]
  integrityPassed: boolean
  duration: number
}

export interface ImportError {
  table: string
  recordId?: number
  error: string
  record?: any
}

export interface SmartExportPayload {
  version: string
  timestamp: string
  createdBy: string
  modules: ModuleData[]
  dependencies: DataModule[]
  signature: string
  encrypted: boolean
  checksum: string
}

const MODULE_TABLES: Record<DataModule, string[]> = {
  products: ['products'],
  customers: ['customers', 'customer_ledger'],
  categories: ['categories'],
  users: ['users'],
  settings: ['settings'],
  sales: ['sales', 'sale_items'],
  expenses: ['expenses'],
  returns: ['returns'],
  accounts: ['accounts'],
  journal: ['journal_entries', 'journal_entry_lines'],
  fiscal_periods: ['fiscal_periods'],
  cash_register: ['cash_register'],
}

const DEPENDENCY_GRAPH: Record<DataModule, DataModule[]> = {
  products: [],
  customers: [],
  categories: [],
  users: [],
  settings: [],
  sales: ['products', 'customers', 'users'],
  expenses: [],
  returns: ['sales', 'products', 'users'],
  accounts: [],
  journal: ['accounts', 'fiscal_periods'],
  fiscal_periods: [],
  cash_register: ['users'],
}

export function getModuleDependencies(modules: DataModule[]): DataModule[] {
  const all = new Set<DataModule>()
  function walk(m: DataModule) {
    if (all.has(m)) return
    all.add(m)
    for (const dep of DEPENDENCY_GRAPH[m]) walk(dep)
  }
  for (const m of modules) walk(m)
  return Array.from(all).filter(m => !modules.includes(m))
}

export function getModuleWarnings(modules: DataModule[]): string[] {
  const warnings: string[] = []
  if (modules.includes('sales') && !modules.includes('customers')) {
    warnings.push('فروش‌ها شامل مشتریان هستند — مشتریان مرتبط به‌صورت خودکار اضافه شدند')
  }
  if (modules.includes('sales') && !modules.includes('products')) {
    warnings.push('فروش‌ها شامل محصولات هستند — محصولات مرتبط به‌صورت خودکار اضافه شدند')
  }
  if (modules.includes('returns') && !modules.includes('sales')) {
    warnings.push('مرجوعی‌ها شامل فروش‌ها هستند — فروش‌های مرتبط به‌صورت خودکار اضافه شدند')
  }
  if (modules.includes('journal') && !modules.includes('accounts')) {
    warnings.push('اسناد حسابداری شامل حساب‌ها هستند — حساب‌ها به‌صورت خودکار اضافه شدند')
  }
  return warnings
}

function getSensitiveColumns(table: string): string[] {
  const sensitive: Record<string, string[]> = {
    customers: ['phone', 'address', 'notes', 'balance'],
    users: ['pin_code'],
    sales: ['customerPaid', 'changeAmount'],
    settings: ['value'],
  }
  return sensitive[table] || []
}

function encryptData(data: string, password: string): string {
  const key = crypto.scryptSync(password, 'hamtraz-salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return iv.toString('hex') + ':' + tag + ':' + encrypted
}

function decryptData(encrypted: string, password: string): string {
  const [ivHex, tagHex, data] = encrypted.split(':')
  const key = crypto.scryptSync(password, 'hamtraz-salt', 32)
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function encryptSensitiveFields(rows: any[], table: string, password: string): any[] {
  const cols = getSensitiveColumns(table)
  if (cols.length === 0) return rows
  return rows.map(row => {
    const copy = { ...row }
    for (const col of cols) {
      if (copy[col] !== undefined && copy[col] !== null) {
        copy[col] = encryptData(String(copy[col]), password)
      }
    }
    return copy
  })
}

function decryptSensitiveFields(rows: any[], table: string, password: string): any[] {
  const cols = getSensitiveColumns(table)
  if (cols.length === 0) return rows
  return rows.map(row => {
    const copy = { ...row }
    for (const col of cols) {
      if (copy[col] && typeof copy[col] === 'string' && copy[col].includes(':')) {
        try {
          copy[col] = decryptData(copy[col], password)
        } catch {
          throw new Error(`خطا در رمزگشایی فیلد ${col} از جدول ${table}`)
        }
      }
    }
    return copy
  })
}

function computeChecksum(payload: Omit<SmartExportPayload, 'checksum'>): string {
  const data = JSON.stringify(payload)
  return crypto.createHash('sha256').update(data).digest('hex')
}

function computeSignature(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

function validatePayload(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['فرمت فایل نامعتبر است'] }
  }
  if (!data.version) errors.push('نسخه فایل موجود نیست')
  if (!data.timestamp) errors.push('تاریخ صادرات موجود نیست')
  if (!Array.isArray(data.modules)) errors.push('داده‌های ماژول موجود نیست')
  if (data.modules) {
    for (const mod of data.modules) {
      if (!mod.module) errors.push('نام ماژول نامعتبر')
      if (!mod.tables || typeof mod.tables !== 'object') errors.push(`ماژول ${mod.module}: جدول‌ها نامعتبر هستند`)
    }
  }
  return { valid: errors.length === 0, errors }
}

function validateTableData(table: string, rows: any[]): ImportError[] {
  const errors: ImportError[] = []
  const requiredFields: Record<string, string[]> = {
    products: ['id', 'title', 'barcode'],
    customers: ['id', 'name'],
    sales: ['id', 'invoiceNumber', 'createdAt'],
    sale_items: ['id', 'saleId', 'quantity'],
    expenses: ['id', 'category', 'amount'],
    users: ['id', 'name', 'pin_code'],
    accounts: ['id', 'code', 'name', 'type'],
    journal_entries: ['id', 'entryDate'],
    journal_entry_lines: ['id', 'entryId', 'accountId'],
    categories: ['id', 'name'],
    returns: ['id', 'saleId'],
    fiscal_periods: ['id', 'name'],
    cash_register: ['id'],
    customer_ledger: ['id', 'customerId'],
    settings: ['key'],
  }

  const req = requiredFields[table] || []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    for (const field of req) {
      if (row[field] === undefined || row[field] === null) {
        errors.push({
          table,
          recordId: row.id || i,
          error: `فیلد "${field}" خالی یا ناموجود است`,
        })
      }
    }
  }
  return errors
}

export function smartExport(options: ExportOptions, userName: string = 'system'): ExportResult {
  try {
    const db = getDatabase()
    const modules: ModuleData[] = []

    const allModules = [...new Set([...options.modules, ...getModuleDependencies(options.modules)])]

    for (const mod of allModules) {
      const tables = MODULE_TABLES[mod]
      if (!tables) continue
      const tableData: Record<string, any[]> = {}
      let recordCount = 0

      for (const table of tables) {
        try {
          const rows = db.prepare(`SELECT * FROM ${table}`).all() as any[]
          const filtered = options.includeImages ? rows : rows.map(r => {
            const copy = { ...r }
            for (const key of Object.keys(copy)) {
              if (key.includes('image') && typeof copy[key] === 'string' && copy[key].length > 1000) {
                copy[key] = '[IMAGE_REMOVED]'
              }
            }
            return copy
          })
          tableData[table] = options.password ? encryptSensitiveFields(filtered, table, options.password) : filtered
          recordCount += filtered.length
        } catch {
          tableData[table] = []
        }
      }

      modules.push({ module: mod, tables: tableData, recordCount })
    }

    const timestamp = new Date().toISOString()

    let payload = {
      version: '2.0',
      timestamp,
      createdBy: userName,
      modules,
      dependencies: getModuleDependencies(options.modules),
      encrypted: !!options.password,
      signature: '',
    }

    const checksum = computeChecksum(payload as any)
    const signature = computeSignature(JSON.stringify(payload) + checksum, SIGNATURE_KEY)

    const fullPayload: SmartExportPayload = {
      ...payload,
      signature,
      checksum,
    }

    return { success: true, data: fullPayload }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export function smartImport(data: SmartExportPayload, options: ImportOptions, userName: string = 'system'): ImportResult {
  const startTime = Date.now()
  const result: ImportResult = {
    success: false,
    recordsImported: {},
    errors: [],
    warnings: [],
    integrityPassed: false,
    duration: 0,
  }

  const validation = validatePayload(data)
  if (!validation.valid) {
    result.errors.push(...validation.errors.map(e => ({ table: 'general', error: e })))
    result.duration = Date.now() - startTime
    return result
  }

  const expectedChecksum = computeChecksum({
    version: data.version,
    timestamp: data.timestamp,
    createdBy: data.createdBy,
    modules: data.modules,
    dependencies: data.dependencies,
    encrypted: data.encrypted,
    signature: '',
  } as any)
  if (data.checksum && data.checksum !== expectedChecksum) {
    result.warnings.push('هش تطابق ندارد — ممکن است فایل تغییر کرده باشد')
  }

  const expectedSig = computeSignature(JSON.stringify({
    version: data.version,
    timestamp: data.timestamp,
    createdBy: data.createdBy,
    modules: data.modules,
    dependencies: data.dependencies,
    encrypted: data.encrypted,
    signature: '',
  }) + data.checksum, SIGNATURE_KEY)
  if (data.signature && data.signature !== expectedSig) {
    result.warnings.push('امضای دیجیتال نامعتبر — اصالت فایل تأیید نشد')
  }

  if (data.encrypted && !options.password) {
    result.errors.push({ table: 'general', error: 'فایل رمزگذاری شده است — لطفاً رمز عبور را وارد کنید' })
    result.duration = Date.now() - startTime
    return result
  }

  const db = getDatabase()
  const importErrors: ImportError[] = []

  const transaction = db.transaction(() => {
    for (const modData of data.modules) {
      const modName = modData.module as DataModule
      if (!options.modules.includes(modName) && !getModuleDependencies(options.modules).includes(modName)) {
        continue
      }

      for (const [table, rows] of Object.entries(modData.tables)) {
        if (!rows || rows.length === 0) continue

        if (options.validate) {
          const decrypted = (data.encrypted && options.password)
            ? decryptSensitiveFields(rows, table, options.password)
            : rows
          const tableErrors = validateTableData(table, decrypted)
          if (tableErrors.length > 0) {
            importErrors.push(...tableErrors)
            continue
          }
        }

        let finalRows = rows
        if (data.encrypted && options.password) {
          try {
            finalRows = decryptSensitiveFields(rows, table, options.password)
          } catch (err: any) {
            importErrors.push({ table, error: `خطا در رمزگشایی: ${err.message}` })
            continue
          }
        }

        try {
          const existing = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }

          if (options.conflictResolution === 'replace' || existing.c === 0) {
            db.prepare(`DELETE FROM ${table}`).run()
            const insert = db.prepare(`INSERT INTO ${table} (${Object.keys(finalRows[0]).join(',')}) VALUES (${Object.keys(finalRows[0]).map(() => '?').join(',')})`)
            for (const row of finalRows) {
              insert.run(...Object.values(row))
            }
          } else if (options.conflictResolution === 'skip') {
            const existingIds = new Set(
              (db.prepare(`SELECT id FROM ${table}`).all() as any[]).map(r => r.id)
            )
            const newRows = finalRows.filter(r => !existingIds.has(r.id))
            if (newRows.length > 0) {
              const insert = db.prepare(`INSERT INTO ${table} (${Object.keys(newRows[0]).join(',')}) VALUES (${Object.keys(newRows[0]).map(() => '?').join(',')})`)
              for (const row of newRows) {
                insert.run(...Object.values(row))
              }
            }
          } else if (options.conflictResolution === 'merge') {
            for (const row of finalRows) {
              const exists = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(row.id)
              if (exists) {
                const updateCols = Object.keys(row).filter(k => k !== 'id')
                const setClause = updateCols.map(k => `${k} = ?`).join(', ')
                db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...updateCols.map(k => row[k]), row.id)
              } else {
                const insert = db.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`)
                insert.run(...Object.values(row))
              }
            }
          }

          result.recordsImported[table] = (result.recordsImported[table] || 0) + finalRows.length
        } catch (err: any) {
          importErrors.push({ table, error: `خطا در وارد کردن: ${err.message}` })
        }
      }
    }
  })

  try {
    transaction()
    result.success = true
  } catch (err: any) {
    result.errors.push({ table: 'transaction', error: `تراکنش ناموفق — تمام تغییرات برگردانده شد: ${err.message}` })
  }

  if (result.success) {
    try {
      const integrity = checkImportIntegrity()
      result.integrityPassed = integrity.passed
      if (integrity.issues.length > 0) {
        result.warnings.push(...integrity.issues)
      }
    } catch {
      result.warnings.push('بررسی یکپارچگی اجرا نشد')
    }

    logAuditOperation('import', userName, {
      modules: options.modules,
      records: result.recordsImported,
    })
  }

  result.errors.push(...importErrors)
  result.duration = Date.now() - startTime
  return result
}

function checkImportIntegrity(): { passed: boolean; issues: string[] } {
  const db = getDatabase()
  const issues: string[] = []

  const saleOrphans = db.prepare(
    `SELECT COUNT(*) as c FROM sale_items si LEFT JOIN products p ON si.productId = p.id WHERE p.id IS NULL`
  ).get() as { c: number }
  if (saleOrphans.c > 0) issues.push(`${saleOrphans.c} آیتم فروش بدون محصول مرجع`)

  const saleCustomerOrphans = db.prepare(
    `SELECT COUNT(*) as c FROM sales s LEFT JOIN customers c ON s.customerId = c.id WHERE s.customerId IS NOT NULL AND c.id IS NULL`
  ).get() as { c: number }
  if (saleCustomerOrphans.c > 0) issues.push(`${saleCustomerOrphans.c} فروش بدون مشتری مرجع`)

  const journalLineOrphans = db.prepare(
    `SELECT COUNT(*) as c FROM journal_entry_lines jel LEFT JOIN journal_entries je ON jel.entryId = je.id WHERE je.id IS NULL`
  ).get() as { c: number }
  if (journalLineOrphans.c > 0) issues.push(`${journalLineOrphans.c} خط حسابداری بدون سند مرجع`)

  const journalAccountOrphans = db.prepare(
    `SELECT COUNT(*) as c FROM journal_entry_lines jel LEFT JOIN accounts a ON jel.accountId = a.id WHERE a.id IS NULL`
  ).get() as { c: number }
  if (journalAccountOrphans.c > 0) issues.push(`${journalAccountOrphans.c} خط حسابداری بدون حساب مرجع`)

  return { passed: issues.length === 0, issues }
}

function logAuditOperation(action: string, _userName: string, details: any): void {
  try {
    const db = getDatabase()
    db.prepare(
      `INSERT INTO audit_log (userId, action, entityType, entityId, details, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(0, action, 'system', 0, JSON.stringify(details), new Date().toISOString())
  } catch {}
}

export function verifySignature(data: SmartExportPayload): { valid: boolean; reason: string } {
  if (!data.signature) return { valid: false, reason: 'امضایی موجود نیست' }

  const payloadWithoutSig = { ...data, signature: '', checksum: '' }
  const expectedChecksum = computeChecksum(payloadWithoutSig as any)
  const expectedSig = computeSignature(JSON.stringify(payloadWithoutSig) + data.checksum, SIGNATURE_KEY)

  if (data.checksum !== expectedChecksum) return { valid: false, reason: 'هش تطابق ندارد' }
  if (data.signature !== expectedSig) return { valid: false, reason: 'امضا نامعتبر است' }
  return { valid: true, reason: 'امضا معتبر است' }
}

export function getExportModuleList(): { key: DataModule; label: string; tables: string[]; description: string }[] {
  return [
    { key: 'products', label: 'محصولات', tables: MODULE_TABLES.products, description: 'لیست کالاها با قیمت و موجودی' },
    { key: 'customers', label: 'مشتریان', tables: MODULE_TABLES.customers, description: 'اطلاعات مشتریان و دفتر کل' },
    { key: 'categories', label: 'دسته‌بندی‌ها', tables: MODULE_TABLES.categories, description: 'دسته‌بندی محصولات' },
    { key: 'users', label: 'کاربران', tables: MODULE_TABLES.users, description: 'حساب‌های کاربری' },
    { key: 'settings', label: 'تنظیمات', tables: MODULE_TABLES.settings, description: 'تنظیمات فروشگاه و سیستم' },
    { key: 'sales', label: 'فروش‌ها', tables: MODULE_TABLES.sales, description: 'فاکتورها و اقلام فروش' },
    { key: 'expenses', label: 'هزینه‌ها', tables: MODULE_TABLES.expenses, description: 'هزینه‌های ثبت شده' },
    { key: 'returns', label: 'مرجوعی‌ها', tables: MODULE_TABLES.returns, description: 'اقلام مرجوعی' },
    { key: 'accounts', label: 'حساب‌ها', tables: MODULE_TABLES.accounts, description: 'دفتر حسابها (حسابداری)' },
    { key: 'journal', label: 'اسناد حسابداری', tables: MODULE_TABLES.journal, description: 'روزنامه و خطوط حسابداری' },
    { key: 'fiscal_periods', label: 'دوره‌های مالی', tables: MODULE_TABLES.fiscal_periods, description: 'دوره‌های مالی' },
    { key: 'cash_register', label: 'صندوق', tables: MODULE_TABLES.cash_register, description: 'گزارش صندوق' },
  ]
}

export function getExportPresets(): { key: string; label: string; description: string; modules: DataModule[] }[] {
  return [
    { key: 'all', label: 'همه داده‌ها', description: 'خروجی کامل از تمام اطلاعات', modules: ['products', 'customers', 'categories', 'users', 'settings', 'sales', 'expenses', 'returns', 'accounts', 'journal', 'fiscal_periods', 'cash_register'] },
    { key: 'core', label: 'داده‌های اصلی', description: 'محصولات، مشتریان و فاکتورها', modules: ['products', 'customers', 'categories', 'sales'] },
    { key: 'settings_only', label: 'فقط تنظیمات', description: 'تنظیمات سیستم و کاربران', modules: ['settings', 'users'] },
    { key: 'financial', label: 'داده‌های مالی', description: 'فاکتورها، پرداخت‌ها و حسابداری', modules: ['sales', 'expenses', 'returns', 'accounts', 'journal', 'fiscal_periods'] },
  ]
}

export function saveExportFile(payload: SmartExportPayload, filePath: string): void {
  const json = JSON.stringify(payload, null, 2)
  fs.writeFileSync(filePath, json, 'utf8')
}

export function loadExportFile(filePath: string): SmartExportPayload {
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}
