import { ipcMain, dialog, BrowserWindow } from 'electron'
import type { ProductInput, SaleInput, CustomerInput, ExpenseInput } from '../../types'
import * as products from '../database/repositories/products'
import * as sales from '../database/repositories/sales'
import * as auth from '../database/repositories/auth'
import * as suspend from '../database/repositories/suspend'
import * as settingsRepo from '../database/repositories/settings'
import * as customers from '../database/repositories/customers'
import * as expenses from '../database/repositories/expenses'
import * as cashRegister from '../database/repositories/cashRegister'
import * as categoriesRepo from '../database/repositories/categories'
import * as auditRepo from '../database/repositories/audit'
import * as returnsRepo from '../database/repositories/returns'
import * as accountsRepo from '../database/repositories/accounts'
import * as journalRepo from '../database/repositories/journal'
import * as periodsRepo from '../database/repositories/periods'
import * as reportsRepo from '../database/repositories/reports'
import { isFirstRun, getDatabase } from '../database/connection'
import { writeFileSync, readFileSync } from 'fs'

function handle<T>(channel: string, fn: () => T): void {
  ipcMain.handle(channel, (_event) => {
    try { return { success: true, data: fn() } }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
}

function handleArg<TArg, TResult>(channel: string, fn: (arg: TArg) => TResult): void {
  ipcMain.handle(channel, (_event, arg: TArg) => {
    try { return { success: true, data: fn(arg) } }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
}

export function registerAllHandlers(): void {
  // ─── System ─────────────────────────────────────────────
  handle('system:isFirstRun', () => ({ isFirstRun: isFirstRun() }))

  // ─── Auth ───────────────────────────────────────────────
  handleArg<{ pinCode: string }, ReturnType<typeof auth.login>>('auth:login', (a) => auth.login(a.pinCode))
  handle('auth:listUsers', () => auth.getAllUsers())
  handleArg<{ name: string; pinCode: string; role: 'admin' | 'cashier' }, ReturnType<typeof auth.createUser>>('auth:createUser', (a) => auth.createUser(a.name, a.pinCode, a.role))
  handleArg<{ id: number }, boolean>('auth:deleteUser', (a) => auth.deleteUser(a.id))
  handleArg<{ id: number; newPin: string }, boolean>('auth:changePin', (a) => auth.changePin(a.id, a.newPin))

  // ─── Products ───────────────────────────────────────────
  handle('products:getAll', () => products.getAllProducts())
  handleArg<{ id: number }, ReturnType<typeof products.getProductById>>('products:getById', (a) => products.getProductById(a.id))
  handleArg<{ barcode: string }, ReturnType<typeof products.getProductByBarcode>>('products:getByBarcode', (a) => products.getProductByBarcode(a.barcode))
  handleArg<{ query: string }, ReturnType<typeof products.searchProducts>>('products:search', (a) => products.searchProducts(a.query))
  ipcMain.handle('products:create', (_event, a: ProductInput) => {
    try {
      if (!a.barcode || a.barcode.trim() === '') {
        const db = getDatabase()
        const row = db.prepare("SELECT barcode FROM products WHERE barcode LIKE 'PRD-%' ORDER BY CAST(SUBSTR(barcode, 5) AS INTEGER) DESC LIMIT 1").get() as { barcode: string } | undefined
        const lastNum = row ? parseInt(row.barcode.replace('PRD-', '')) : 0
        a.barcode = `PRD-${String(lastNum + 1).padStart(6, '0')}`
      }
      const result = products.createProduct(a)
      auditRepo.createAuditEntry(null, 'create', 'product', result.id, JSON.stringify({ title: a.title, barcode: a.barcode }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('products:update', (_event, a: { id: number; data: Partial<ProductInput> }) => {
    try {
      const result = products.updateProduct(a.id, a.data)
      auditRepo.createAuditEntry(null, 'update', 'product', a.id, JSON.stringify({ fields: Object.keys(a.data) }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('products:delete', (_event, a: { id: number }) => {
    try {
      const result = products.deleteProduct(a.id)
      auditRepo.createAuditEntry(null, 'delete', 'product', a.id)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('products:updateStock', (_event, a: { productId: number; quantityChange: number }) => {
    try {
      const result = products.updateStock(a.productId, a.quantityChange)
      auditRepo.createAuditEntry(null, 'restock', 'product', a.productId, JSON.stringify({ quantityChange: a.quantityChange }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  handle('products:lowStock', () => products.getLowStockProducts())
  handle('products:loose', () => products.getLooseProducts())
  handle('products:categories', () => products.getProductCategories())
  ipcMain.handle('products:reportData', () => {
    try {
      const db = getDatabase()
      const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count,
               SUM(stock) as totalStock,
               SUM(stock * purchase_price) as totalValue,
               SUM(stock * sale_price) as retailValue
        FROM products WHERE isActive = 1
        GROUP BY category ORDER BY totalValue DESC
      `).all()
      const slowMoving = db.prepare(`
        SELECT p.id, p.title, p.stock, p.purchase_price, p.category,
               MAX(si.createdAt) as lastSoldAt
        FROM products p
        LEFT JOIN sale_items si ON si.productId = p.id
        WHERE p.isActive = 1 AND p.stock > 0
        GROUP BY p.id
        HAVING lastSoldAt IS NULL OR julianday('now') - julianday(lastSoldAt) > 30
        ORDER BY (julianday('now') - julianday(lastSoldAt)) DESC
      `).all()
      return { success: true, data: { byCategory, slowMoving } }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })

  // ─── Sales ──────────────────────────────────────────────
  ipcMain.handle('sales:create', (_event, a: SaleInput) => {
    try {
      const result = sales.createSale(a)
      const total = a.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      auditRepo.createAuditEntry(null, 'create', 'sale', result.id, JSON.stringify({ total }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  handleArg<{ id: number }, ReturnType<typeof sales.getSaleById>>('sales:getById', (a) => sales.getSaleById(a.id))
  handleArg<{ startDate: string; endDate: string }, ReturnType<typeof sales.getSalesByDateRange>>('sales:getByDateRange', (a) => sales.getSalesByDateRange(a.startDate, a.endDate))
  handleArg<{ date: string }, ReturnType<typeof sales.getDailySalesSummary>>('sales:dailySummary', (a) => sales.getDailySalesSummary(a.date))
  handleArg<{ startDate?: string; endDate?: string }, ReturnType<typeof sales.getUserPerformance>>('sales:userPerformance', (a) => sales.getUserPerformance(a.startDate, a.endDate))
  handleArg<{ startDate?: string; endDate?: string }, ReturnType<typeof sales.getTopProducts>>('sales:topProducts', (a) => sales.getTopProducts(a.startDate, a.endDate))

  // ─── Customers / Ledger ─────────────────────────────────
  handle('customers:getAll', () => customers.getAllCustomers())
  handleArg<{ id: number }, ReturnType<typeof customers.getCustomerById>>('customers:getById', (a) => customers.getCustomerById(a.id))
  handleArg<{ query: string }, ReturnType<typeof customers.searchCustomers>>('customers:search', (a) => customers.searchCustomers(a.query))
  handleArg<CustomerInput, ReturnType<typeof customers.createCustomer>>('customers:create', (a) => customers.createCustomer(a))
  handleArg<{ id: number; data: Partial<CustomerInput> }, ReturnType<typeof customers.updateCustomer>>('customers:update', (a) => customers.updateCustomer(a.id, a.data))
  handleArg<{ id: number }, boolean>('customers:delete', (a) => customers.deleteCustomer(a.id))
  handleArg<{ customerId: number; amount: number }, boolean>('customers:charge', (a) => { customers.updateCustomerBalance(a.customerId, a.amount); customers.addLedgerEntry(a.customerId, null, 'charge', a.amount, 'شارژ حساب'); return true })
  handleArg<{ customerId: number; amount: number }, boolean>('customers:pay', (a) => { customers.updateCustomerBalance(a.customerId, a.amount); customers.addLedgerEntry(a.customerId, null, 'payment', a.amount, 'پرداخت بدهی'); return true })
  handleArg<{ customerId: number }, ReturnType<typeof customers.getLedgerEntries>>('customers:ledger', (a) => customers.getLedgerEntries(a.customerId))

  // ─── Expenses ───────────────────────────────────────────
  handle('expenses:getAll', () => expenses.getAllExpenses())
  handleArg<{ startDate: string; endDate: string }, ReturnType<typeof expenses.getExpensesByDateRange>>('expenses:getByDateRange', (a) => expenses.getExpensesByDateRange(a.startDate, a.endDate))
  ipcMain.handle('expenses:create', (_event, a: ExpenseInput) => {
    try {
      const result = expenses.createExpense(a)
      auditRepo.createAuditEntry(null, 'create', 'expense', result.id, JSON.stringify({ category: a.category, amount: a.amount }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('expenses:delete', (_event, a: { id: number }) => {
    try {
      const result = expenses.deleteExpense(a.id)
      auditRepo.createAuditEntry(null, 'delete', 'expense', a.id)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  handle('expenses:categories', () => expenses.getExpenseCategories())
  handle('expenses:total', () => expenses.getTotalExpenses())

  // ─── Cash Register ──────────────────────────────────────
  handle('cashRegister:getToday', () => cashRegister.getTodayRegister())
  handleArg<{ amount: number }, void>('cashRegister:setOpening', (a) => cashRegister.setOpeningBalance(a.amount))
  handleArg<{ userId: number; closingBalance: number }, ReturnType<typeof cashRegister.closeRegister>>('cashRegister:close', (a) => cashRegister.closeRegister(a.userId, a.closingBalance))

  // ─── Suspended ──────────────────────────────────────────
  handleArg<{ userId: number; slotIndex: number; items: any[] }, ReturnType<typeof suspend.saveSuspended>>('suspend:save', (a) => suspend.saveSuspended(a.userId, a.slotIndex, a.items))
  handleArg<{ userId?: number }, ReturnType<typeof suspend.listSuspended>>('suspend:list', (a) => suspend.listSuspended(a.userId))
  handleArg<{ id: number }, ReturnType<typeof suspend.loadSuspended> | undefined>('suspend:load', (a) => suspend.loadSuspended(a.id))
  handleArg<{ id: number }, boolean>('suspend:delete', (a) => suspend.deleteSuspended(a.id))

  // ─── Settings ───────────────────────────────────────────
  handle('settings:getAll', () => settingsRepo.getAllSettings())
  handleArg<{ key: string; value: string }, void>('settings:set', (a) => settingsRepo.setSetting(a.key, a.value))

  // ─── Backup/Restore ─────────────────────────────────────
  ipcMain.handle('backup:export', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'ذخیره فایل پشتیبان',
      defaultPath: `pos-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return { success: false, error: 'cancelled' }
    try {
      const db = getDatabase()
      const tables = ['users', 'products', 'sales', 'sale_items', 'customers', 'customer_ledger', 'expenses', 'suspended_invoices', 'cash_register', 'settings', 'categories', 'audit_log', 'returns', 'accounts', 'fiscal_periods', 'journal_entries', 'journal_entry_lines']
      const backup: Record<string, any> = {}
      for (const table of tables) {
        backup[table] = db.prepare(`SELECT * FROM ${table}`).all()
      }
      backup._metadata = { version: '1.0', exportDate: new Date().toISOString(), appName: 'SuperMarket POS' }
      writeFileSync(result.filePath, JSON.stringify(backup, null, 2), 'utf-8')
      return { success: true, data: result.filePath }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('backup:import', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'انتخاب فایل پشتیبان',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return { success: false, error: 'cancelled' }
    try {
      const data = JSON.parse(readFileSync(result.filePaths[0], 'utf-8'))
      const db = getDatabase()
      const tables = ['users', 'products', 'sales', 'sale_items', 'customers', 'customer_ledger', 'expenses', 'suspended_invoices', 'cash_register', 'settings', 'categories', 'audit_log', 'returns', 'accounts', 'fiscal_periods', 'journal_entries', 'journal_entry_lines']
      const restore = db.transaction(() => {
        for (const table of tables) {
          if (data[table] && Array.isArray(data[table])) {
            db.prepare(`DELETE FROM ${table}`).run()
            if (data[table].length > 0) {
              const cols = Object.keys(data[table][0])
              const placeholders = cols.map(() => '?').join(',')
              const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`)
              for (const row of data[table]) {
                stmt.run(...cols.map((c) => row[c]))
              }
            }
          }
        }
      })
      restore()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  // ─── Categories ─────────────────────────────────────
  handle('categories:getAll', () => categoriesRepo.getAllCategories())
  handle('categories:getTree', () => categoriesRepo.getCategoryTree())
  handleArg<{ name: string; parentId?: number }, any>('categories:create', (a) => categoriesRepo.createCategory(a.name, a.parentId))
  handleArg<{ id: number; name: string }, boolean>('categories:update', (a) => { categoriesRepo.updateCategory(a.id, a.name); return true })
  handleArg<{ id: number }, boolean>('categories:delete', (a) => categoriesRepo.deleteCategory(a.id))

  // ─── Audit Log ─────────────────────────────────────
  handleArg<{ entityType?: string; limit?: number; startDate?: string; endDate?: string }, any>('audit:getAll', (a) => auditRepo.getAuditLog(a.entityType, a.limit || 100, a.startDate, a.endDate))
  handleArg<{ entityType: string; entityId: number }, any>('audit:getForEntity', (a) => auditRepo.getAuditForEntity(a.entityType, a.entityId))
  handle('audit:stats', () => auditRepo.getAuditStats())

  // ─── Returns ─────────────────────────────────────
  ipcMain.handle('returns:create', (_event, a: { saleId: number; userId: number; productId: number; quantity: number; reason: string; refundAmount: number }) => {
    try {
      const result = returnsRepo.createReturn(a.saleId, a.userId, a.productId, a.quantity, a.reason, a.refundAmount)
      auditRepo.createAuditEntry(a.userId, 'return', 'return', result.id, JSON.stringify({ saleId: a.saleId, productId: a.productId, quantity: a.quantity, refundAmount: a.refundAmount }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  handleArg<{ limit?: number }, any>('returns:list', (a) => returnsRepo.getReturns(a.limit || 100))
  handle('returns:stats', () => returnsRepo.getReturnStats())

  // ─── Accounts (Chart of Accounts) ────────────────────
  handle('accounts:getAll', () => accountsRepo.getAllAccounts())
  handle('accounts:getTree', () => accountsRepo.getAccountTree())
  handleArg<{ id: number }, any>('accounts:getById', (a) => accountsRepo.getAccountById(a.id))
  handleArg<{ type: string }, any>('accounts:getByType', (a) => accountsRepo.getAccountsByType(a.type as any))
  handleArg<{ code: string; name: string; type: string; parentId?: number | null; description?: string }, any>('accounts:create', (a) => accountsRepo.createAccount(a as any))
  handleArg<{ id: number; data: { code?: string; name?: string; type?: string; parentId?: number | null; description?: string } }, any>('accounts:update', (a) => accountsRepo.updateAccount(a.id, a.data as any))
  handleArg<{ id: number }, boolean>('accounts:delete', (a) => accountsRepo.deleteAccount(a.id))
  handleArg<{ id: number }, boolean>('accounts:toggleActive', (a) => accountsRepo.toggleAccountActive(a.id))

  // ─── Journal Entries ─────────────────────────────────
  handleArg<{ startDate?: string; endDate?: string; referenceType?: string; limit?: number; offset?: number }, any>('journal:entries', (a) => journalRepo.getJournalEntries(a))
  handleArg<{ id: number }, any>('journal:getById', (a) => journalRepo.getJournalEntryById(a.id))
  handleArg<{ entryDate: string; description: string; lines: { accountId: number; debit: number; credit: number; description?: string }[] }, any>('journal:create', (a) => journalRepo.createJournalEntry({ ...a, referenceType: 'manual' }))
  handleArg<{ startDate?: string; endDate?: string }, any>('journal:trialBalance', (a) => journalRepo.getTrialBalance(a.startDate, a.endDate))
  handleArg<{ accountId: number; startDate?: string; endDate?: string }, any>('journal:ledger', (a) => journalRepo.getGeneralLedger(a.accountId, a.startDate, a.endDate))

  // ─── Financial Reports ───────────────────────────────
  handleArg<{ startDate?: string; endDate?: string }, any>('reports:profitLoss', (a) => reportsRepo.generateProfitLoss(a.startDate, a.endDate))
  handleArg<{ asOfDate?: string }, any>('reports:balanceSheet', (a) => reportsRepo.generateBalanceSheet(a.asOfDate))
  handle('reports:arAging', () => reportsRepo.generateARAging())

  // ─── Fiscal Periods ──────────────────────────────────
  handle('periods:getAll', () => periodsRepo.getAllPeriods())
  handle('periods:getActive', () => periodsRepo.getActivePeriod())
  handleArg<{ id: number; userId: number }, boolean>('periods:close', (a) => periodsRepo.closePeriod(a.id, a.userId))

  // ─── Accounting Migration ────────────────────────────
  handle('accounting:migrate', () => {
    const db = getDatabase()
    const existingJE = db.prepare('SELECT COUNT(*) as c FROM journal_entries').get() as { c: number }
    if (existingJE.c > 0) return false

    // Backfill sales
    const allSales = db.prepare('SELECT * FROM sales').all() as any[]
    const allSaleItems = db.prepare('SELECT * FROM sale_items').all() as any[]
    for (const sale of allSales) {
      const items = allSaleItems.filter((si: any) => si.saleId === sale.id)
      journalRepo.postSaleJournal(sale.id, sale.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10), {
        items: items.map((i: any) => ({ purchasePrice: i.purchasePrice, quantity: i.quantity })),
        total_amount: sale.total_amount, paymentMethod: sale.paymentMethod
      })
    }
    // Backfill expenses
    const allExpenses = db.prepare('SELECT * FROM expenses').all() as any[]
    for (const exp of allExpenses) {
      journalRepo.postExpenseJournal(exp.id, exp.date || new Date().toISOString().slice(0, 10), exp.amount, exp.category)
    }
    // Backfill returns
    const allReturns = db.prepare('SELECT * FROM returns').all() as any[]
    for (const ret of allReturns) {
      journalRepo.postReturnJournal(ret.id, ret.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10), ret.refundAmount)
    }
    return true
  })
}
