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
  handleArg<ProductInput, ReturnType<typeof products.createProduct>>('products:create', (a) => {
    if (!a.barcode || a.barcode.trim() === '') {
      const db = getDatabase()
      const row = db.prepare("SELECT barcode FROM products WHERE barcode LIKE 'PRD-%' ORDER BY CAST(SUBSTR(barcode, 5) AS INTEGER) DESC LIMIT 1").get() as { barcode: string } | undefined
      const lastNum = row ? parseInt(row.barcode.replace('PRD-', '')) : 0
      a.barcode = `PRD-${String(lastNum + 1).padStart(6, '0')}`
    }
    return products.createProduct(a)
  })
  handleArg<{ id: number; data: Partial<ProductInput> }, ReturnType<typeof products.updateProduct>>('products:update', (a) => products.updateProduct(a.id, a.data))
  handleArg<{ id: number }, boolean>('products:delete', (a) => products.deleteProduct(a.id))
  handleArg<{ productId: number; quantityChange: number }, boolean>('products:updateStock', (a) => products.updateStock(a.productId, a.quantityChange))
  handle('products:lowStock', () => products.getLowStockProducts())
  handle('products:loose', () => products.getLooseProducts())
  handle('products:categories', () => products.getProductCategories())

  // ─── Sales ──────────────────────────────────────────────
  handleArg<SaleInput, ReturnType<typeof sales.createSale>>('sales:create', (a) => sales.createSale(a))
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
  handleArg<ExpenseInput, ReturnType<typeof expenses.createExpense>>('expenses:create', (a) => expenses.createExpense(a))
  handleArg<{ id: number }, boolean>('expenses:delete', (a) => expenses.deleteExpense(a.id))
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
      const tables = ['users', 'products', 'sales', 'sale_items', 'customers', 'customer_ledger', 'expenses', 'suspended_invoices', 'cash_register', 'settings']
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
      const tables = ['users', 'products', 'sales', 'sale_items', 'customers', 'customer_ledger', 'expenses', 'suspended_invoices', 'cash_register', 'settings']
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
  handleArg<{ entityType?: string; limit?: number }, any>('audit:getAll', (a) => auditRepo.getAuditLog(a.entityType, a.limit || 100))
  handleArg<{ entityType: string; entityId: number }, any>('audit:getForEntity', (a) => auditRepo.getAuditForEntity(a.entityType, a.entityId))
  handle('audit:stats', () => auditRepo.getAuditStats())

  // ─── Returns ─────────────────────────────────────
  handleArg<{ saleId: number; userId: number; productId: number; quantity: number; reason: string; refundAmount: number }, any>('returns:create', (a) => returnsRepo.createReturn(a.saleId, a.userId, a.productId, a.quantity, a.reason, a.refundAmount))
  handleArg<{ limit?: number }, any>('returns:list', (a) => returnsRepo.getReturns(a.limit || 100))
  handle('returns:stats', () => returnsRepo.getReturnStats())
}
