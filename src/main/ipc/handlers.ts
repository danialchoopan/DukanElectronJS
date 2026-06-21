import { ipcMain, dialog, BrowserWindow } from 'electron'
import type { ProductInput, SaleInput, CustomerInput, ExpenseInput } from '../../types'
import * as products from '../database/repositories/products'
import * as sales from '../database/repositories/sales'
import * as auth from '../database/repositories/auth'
import * as suspend from '../database/repositories/suspend'
import * as settingsRepo from '../database/repositories/settings'
import * as printSettings from '../database/repositories/printSettings'
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
import * as seedRepo from '../database/repositories/seed'
import * as backupService from '../database/backup'
import * as smartExportService from '../database/smartExport'
import * as migrationService from '../database/migration'
import { runBackupTests } from '../database/backup.test'
import { runSmartExportTests } from '../database/smartExport.test'
import { runMigrationTests } from '../database/migration.test'
import { isFirstRun, getDatabase } from '../database/connection'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { app } from 'electron'

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
      if (a.imageBase64 && a.imageBase64.startsWith('data:image')) {
        try {
          const imagesDir = join(app.getPath('userData'), 'product-images')
          if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })
          const ext = a.imageBase64.startsWith('data:image/png') ? '.png' : '.jpg'
          const filename = `product-${result.id}-${randomBytes(8).toString('hex')}${ext}`
          const base64Data = a.imageBase64.replace(/^data:image\/\w+;base64,/, '')
          writeFileSync(join(imagesDir, filename), Buffer.from(base64Data, 'base64'))
          products.updateProduct(result.id, { imageBase64: filename })
          result.imageBase64 = filename
        } catch {}
      }
      auditRepo.createAuditEntry(null, 'create', 'product', result.id, JSON.stringify({ title: a.title, barcode: a.barcode }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('products:update', (_event, a: { id: number; data: Partial<ProductInput> }) => {
    try {
      if (a.data.imageBase64 && a.data.imageBase64.startsWith('data:image')) {
        try {
          const imagesDir = join(app.getPath('userData'), 'product-images')
          if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })
          const ext = a.data.imageBase64.startsWith('data:image/png') ? '.png' : '.jpg'
          const filename = `product-${a.id}-${randomBytes(8).toString('hex')}${ext}`
          const base64Data = a.data.imageBase64.replace(/^data:image\/\w+;base64,/, '')
          writeFileSync(join(imagesDir, filename), Buffer.from(base64Data, 'base64'))
          a.data.imageBase64 = filename
        } catch {}
      }
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
  ipcMain.handle('products:updateStock', (_event, a: { productId: number; quantityChange: number; reason?: string }) => {
    try {
      const result = products.updateStock(a.productId, a.quantityChange)
      auditRepo.createAuditEntry(null, 'restock', 'product', a.productId, JSON.stringify({ quantityChange: a.quantityChange, reason: a.reason || '' }))
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  handle('products:lowStock', () => products.getLowStockProducts())
  handle('products:loose', () => products.getLooseProducts())
  ipcMain.handle('products:saveImage', (_event, arg: { base64: string; productId: number }) => {
    try {
      const imagesDir = join(app.getPath('userData'), 'product-images')
      if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })
      const ext = arg.base64.startsWith('data:image/png') ? '.png' : '.jpg'
      const filename = `product-${arg.productId}-${randomBytes(8).toString('hex')}${ext}`
      const base64Data = arg.base64.replace(/^data:image\/\w+;base64,/, '')
      const filePath = join(imagesDir, filename)
      writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
      return { success: true, data: filename }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('products:getImage', (_event, arg: { filename: string }) => {
    try {
      const filePath = join(app.getPath('userData'), 'product-images', arg.filename)
      if (!existsSync(filePath)) return { success: false, error: 'File not found' }
      const data = readFileSync(filePath)
      const ext = arg.filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
      const base64 = `data:${ext};base64,${data.toString('base64')}`
      return { success: true, data: base64 }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  handle('products:categories', () => products.getProductCategories())
  ipcMain.handle('products:reportData', () => {
    try {
      const db = getDatabase()
      const byCategory = db.prepare(`
        SELECT COALESCE(NULLIF(category, ''), 'بدون دسته') as category, COUNT(*) as count,
               SUM(stock) as totalStock,
               SUM(stock * purchase_price) as totalValue,
               SUM(stock * sale_price) as retailValue
        FROM products WHERE isActive = 1
        GROUP BY category ORDER BY totalValue DESC
      `).all()
      const slowMoving = db.prepare(`
        SELECT p.id, p.title, p.stock, p.purchase_price, p.category,
               MAX(s.createdAt) as lastSoldAt
        FROM products p
        LEFT JOIN sale_items si ON si.productId = p.id
        LEFT JOIN sales s ON s.id = si.saleId
        WHERE p.isActive = 1 AND p.stock > 0
        GROUP BY p.id
        HAVING lastSoldAt IS NULL OR julianday('now') - julianday(lastSoldAt) > 30
        ORDER BY (julianday('now') - julianday(lastSoldAt)) DESC
      `).all()
      return { success: true, data: { byCategory, slowMoving } }
    } catch (err) {
      console.error('[REPORT ERROR]', err)
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('products:bulkImport', (_event, arg: { products: ProductInput[] }) => {
    try {
      const db = getDatabase()
      const results: { title: string; success: boolean; error?: string }[] = []
      const importTx = db.transaction(() => {
        for (const p of arg.products) {
          try {
            if (!p.title) { results.push({ title: p.title || 'بدون نام', success: false, error: 'نام کالا الزامی است' }); continue }
            if (!p.barcode || p.barcode.trim() === '') {
              const row = db.prepare("SELECT barcode FROM products WHERE barcode LIKE 'PRD-%' ORDER BY CAST(SUBSTR(barcode, 5) AS INTEGER) DESC LIMIT 1").get() as { barcode: string } | undefined
              const lastNum = row ? parseInt(row.barcode.replace('PRD-', '')) : 0
              p.barcode = `PRD-${String(lastNum + 1).padStart(6, '0')}`
            }
            const existing = db.prepare('SELECT id FROM products WHERE barcode = ?').get(p.barcode) as { id: number } | undefined
            if (existing) {
              db.prepare('UPDATE products SET title=?, category=?, unit=?, purchase_price=?, sale_price=?, stock=?, minStock=?, isLoose=? WHERE id=?').run(
                p.title, p.category || '', p.unit || 'number', p.purchase_price, p.sale_price, p.stock, p.minStock || 0, p.isLoose ? 1 : 0, existing.id
              )
              results.push({ title: p.title, success: true })
            } else {
              db.prepare('INSERT INTO products (barcode, title, category, unit, purchase_price, sale_price, stock, minStock, isActive) VALUES (?,?,?,?,?,?,?,?,1)').run(
                p.barcode, p.title, p.category || '', p.unit || 'number', p.purchase_price, p.sale_price, p.stock, p.minStock || 0
              )
              results.push({ title: p.title, success: true })
            }
          } catch (err) {
            results.push({ title: p.title || '?', success: false, error: err instanceof Error ? err.message : String(err) })
          }
        }
      })
      importTx()
      const successCount = results.filter(r => r.success).length
      return { success: true, data: { results, successCount, failCount: results.length - successCount } }
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
  handleArg<{ id: number }, any>('customers:delete', (a) => customers.deleteCustomerSoft(a.id))
  handle('customers:stats', () => customers.getCustomerStats())
  handleArg<{ id: number }, any>('customers:getWithStats', (a) => customers.getCustomerWithStats(a.id))
  handleArg<{ id: number }, any>('customers:purchaseHistory', (a) => customers.getCustomerPurchaseHistory(a.id))
  handle('customers:getAllWithStats', () => customers.getAllCustomersWithStats())
  handleArg<{ id: number }, any>('customers:deleteSoft', (a) => customers.deleteCustomerSoft(a.id))
  ipcMain.handle('customers:charge', (_event, a: { customerId: number; amount: number; description?: string; images?: string[] }) => {
    customers.updateCustomerBalance(a.customerId, a.amount)
    customers.addLedgerEntry(a.customerId, null, 'charge', a.amount, a.description || 'شارژ حساب', a.images)
    auditRepo.createAuditEntry(null, 'create', 'customer', a.customerId, JSON.stringify({ type: 'charge', amount: a.amount }))
    return true
  })
  ipcMain.handle('customers:pay', (_event, a: { customerId: number; amount: number; description?: string; images?: string[] }) => {
    customers.updateCustomerBalance(a.customerId, a.amount)
    customers.addLedgerEntry(a.customerId, null, 'payment', a.amount, a.description || 'پرداخت بدهی', a.images)
    auditRepo.createAuditEntry(null, 'create', 'customer', a.customerId, JSON.stringify({ type: 'payment', amount: a.amount }))
    return true
  })
  handleArg<{ customerId: number }, ReturnType<typeof customers.getLedgerEntries>>('customers:ledger', (a) => customers.getLedgerEntries(a.customerId))

  ipcMain.handle('customers:saveImage', (_event, arg: { base64: string; customerId: number }) => {
    try {
      const imagesDir = join(app.getPath('userData'), 'customer-images')
      if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })
      const ext = arg.base64.startsWith('data:image/png') ? '.png' : '.jpg'
      const filename = `customer-${arg.customerId}-${randomBytes(8).toString('hex')}${ext}`
      const base64Data = arg.base64.replace(/^data:image\/\w+;base64,/, '')
      writeFileSync(join(imagesDir, filename), Buffer.from(base64Data, 'base64'))
      return { success: true, data: filename }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })

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

  ipcMain.handle('expenses:saveImage', (_event, arg: { base64: string; expenseId: number }) => {
    try {
      const imagesDir = join(app.getPath('userData'), 'expense-images')
      if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true })
      const ext = arg.base64.startsWith('data:image/png') ? '.png' : '.jpg'
      const filename = `expense-${arg.expenseId}-${randomBytes(8).toString('hex')}${ext}`
      const base64Data = arg.base64.replace(/^data:image\/\w+;base64,/, '')
      const filePath = join(imagesDir, filename)
      writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
      return { success: true, data: filename }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })

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
  handleArg<{ key: string }, string | null>('settings:get', (a) => settingsRepo.getSetting(a.key) || null)
  handleArg<{ key: string; value: string }, void>('settings:set', (a) => settingsRepo.setSetting(a.key, a.value))

  // ─── Print Settings ─────────────────────────────────────
  handle('printSettings:getAll', () => printSettings.getPrintSettings())
  handleArg<{ settings: Record<string, string> }, boolean>('printSettings:save', (a) => { printSettings.savePrintSettings(a.settings); return true })
  handle('printSettings:reset', () => { printSettings.resetPrintSettings(); return true })
  handleArg<{ type: string; base64: string }, { filename: string; path: string }>('printSettings:uploadAsset', (a) => printSettings.savePrintAsset(a.type, a.base64))
  handleArg<{ filename: string }, string | null>('printSettings:getAsset', (a) => printSettings.getPrintAsset(a.filename))

  // ─── Backup/Restore ─────────────────────────────────────
  ipcMain.handle('backup:export', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'ذخیره فایل پشتیبان',
      defaultPath: `pos-backup-${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    })
    if (result.canceled || !result.filePath) return { success: false, error: 'cancelled' }
    try {
      copyFileSync(join(app.getPath('userData'), 'pos.db'), result.filePath)
      const hash = require('crypto').createHash('sha256').update(require('fs').readFileSync(result.filePath)).digest('hex')
      return { success: true, data: result.filePath, hash }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('backup:import', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'انتخاب فایل پشتیبان',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return { success: false, error: 'cancelled' }
    try {
      copyFileSync(result.filePaths[0], join(app.getPath('userData'), 'pos.db'))
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('backup:create', () => { try { return { success: true, data: backupService.createBackup() } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:delete', (_event, arg: { name: string }) => {
    try {
      const { unlinkSync, existsSync } = require('fs')
      const { join } = require('path')
      const { app } = require('electron')
      const dir = join(app.getPath('userData'), 'backups')
      for (const f of ['db', 'db-wal', 'db-shm', 'meta.json']) {
        const file = join(dir, `${arg.name}.${f}`)
        if (existsSync(file)) unlinkSync(file)
      }
      return { success: true }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })
  ipcMain.handle('backup:auto', () => { try { return { success: true, data: backupService.autoBackup() } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:list', () => { try { return { success: true, data: backupService.listBackups() } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:stats', () => { try { return { success: true, data: backupService.getBackupStats() } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:integrity', (_event, arg: { path?: string }) => { try { return { success: true, data: backupService.checkIntegrity(arg?.path) } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:verify', (_event, arg: { path: string }) => { try { return { success: true, data: backupService.verifyBackup(arg.path) } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:restore', (_event, arg: { path: string }) => { try { return { success: true, data: backupService.restoreBackup(arg.path) } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  ipcMain.handle('backup:cleanup', (_event, arg: { keepCount?: number }) => { try { return { success: true, data: backupService.cleanupBackups(arg?.keepCount || 30) } } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } } })
  handleArg<{ path: string }, any>('backup:details', (a) => backupService.getBackupDetails(a.path))
  handleArg<{ path: string }, any>('backup:checkVersion', (a) => backupService.checkBackupVersion(a.path))
  handleArg<{ path: string }, any>('backup:tableStats', (a) => backupService.getTableStats(a.path))
  handle('backup:runTests', () => {
    return runBackupTests()
  })

  handle('smartExport:runTests', () => {
    return runSmartExportTests()
  })

  handle('migration:runTests', () => {
    return runMigrationTests()
  })

  // ─── Dialog ────────────────────────────────────────
  ipcMain.handle('dialog:openBackup', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'انتخاب فایل پشتیبان',
      filters: [{ name: 'SQLite Database', extensions: ['db', 'db-wal'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return { success: false, error: 'cancelled' }
    return { success: true, data: result.filePaths[0] }
  })

  ipcMain.handle('dialog:openSmartImport', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'انتخاب فایل واردات',
      filters: [{ name: 'Smart Export', extensions: ['hze', 'json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return { success: false, error: 'cancelled' }
    return { success: true, data: result.filePaths[0] }
  })

  // ─── Categories ─────────────────────────────────────
  handle('categories:getAll', () => categoriesRepo.getAllCategories())
  handle('categories:getTree', () => categoriesRepo.getCategoryTree())
  handleArg<{ name: string; parentId?: number }, any>('categories:create', (a) => categoriesRepo.createCategory(a.name, a.parentId))
  handleArg<{ id: number; data: { name?: string; slug?: string; isActive?: boolean } }, boolean>('categories:update', (a) => categoriesRepo.updateCategory(a.id, a.data))
  handleArg<{ id: number }, any>('categories:delete', (a) => {
    const result = categoriesRepo.deleteCategory(a.id)
    return result
  })
  handleArg<{ id: number }, boolean>('categories:toggleActive', (a) => categoriesRepo.toggleCategoryActive(a.id))
  handleArg<{ id: number }, any>('categories:descendants', (a) => ({ ids: categoriesRepo.getCategoryDescendantIds(a.id) }))

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
  handleArg<{ startDate?: string; endDate?: string }, any>('reports:cashFlow', (a) => journalRepo.generateCashFlow(a.startDate, a.endDate))

  // ─── Financial Reports ───────────────────────────────
  handleArg<{ startDate?: string; endDate?: string }, any>('reports:profitLoss', (a) => reportsRepo.generateProfitLoss(a.startDate, a.endDate))
  handleArg<{ asOfDate?: string }, any>('reports:balanceSheet', (a) => reportsRepo.generateBalanceSheet(a.asOfDate))
  handle('reports:arAging', () => reportsRepo.generateARAging())

  // ─── Fiscal Periods ──────────────────────────────────
  handle('periods:getAll', () => periodsRepo.getAllPeriods())
  handle('periods:getActive', () => periodsRepo.getActivePeriod())
  handleArg<{ id: number; userId: number }, boolean>('periods:close', (a) => periodsRepo.closePeriod(a.id, a.userId))
  handleArg<{ id: number }, boolean>('periods:reopen', (a) => periodsRepo.reopenPeriod(a.id))
  ipcMain.handle('periods:create', (_event, a: { name: string; startDate: string; endDate: string }) => {
    try {
      const db = getDatabase()
      db.prepare('INSERT INTO fiscal_periods (name, startDate, endDate) VALUES (?, ?, ?)').run(a.name, a.startDate, a.endDate)
      return { success: true }
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err) } }
  })

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

  // ─── Seed Demo Data ──────────────────────────────────────
  handle('accounting:seedDemo', () => seedRepo.seedDemoData())

  // ─── Smart Export/Import ──────────────────────────────────
  handle('smartExport:modules', () => smartExportService.getExportModuleList())
  handle('smartExport:presets', () => smartExportService.getExportPresets())
  handleArg('smartExport:dependencies', (modules: string[]) => ({
    dependencies: smartExportService.getModuleDependencies(modules as any),
    warnings: smartExportService.getModuleWarnings(modules as any),
  }))

  handleArg('smartExport:execute', (arg: { options: any; userName?: string }) => {
    const result = smartExportService.smartExport(arg.options, arg.userName || 'system')
    if (result.success && result.data) {
      const defaultName = `smart-export-${new Date().toISOString().slice(0, 10)}.hze`
      const win = BrowserWindow.getFocusedWindow()
      const savedPath = dialog.showSaveDialogSync(win || BrowserWindow.getAllWindows()[0], {
        defaultPath: defaultName,
        filters: [{ name: 'Smart Export', extensions: ['hze', 'json'] }],
      })
      if (savedPath) {
        smartExportService.saveExportFile(result.data, savedPath)
        return { success: true, data: { ...result.data, filePath: savedPath } }
      }
      return { success: true, data: result.data }
    }
    return result
  })

  handleArg('smartExport:save', (arg: { data: any; filePath: string }) => {
    smartExportService.saveExportFile(arg.data, arg.filePath)
    return true
  })

  handleArg('smartImport:preview', (arg: { filePath: string }) => {
    const data = smartExportService.loadExportFile(arg.filePath)
    const signature = smartExportService.verifySignature(data)
    return { data, signature }
  })

  handleArg('smartImport:execute', (arg: { data: any; options: any; userName?: string }) => {
    return smartExportService.smartImport(arg.data, arg.options)
  })

  handleArg('smartImport:validate', (arg: { filePath: string }) => {
    try {
      const data = smartExportService.loadExportFile(arg.filePath)
      const signature = smartExportService.verifySignature(data)
      return { valid: true, modules: data.modules.map((m: any) => ({ module: m.module, recordCount: m.recordCount })), signature, encrypted: data.encrypted }
    } catch (err: any) {
      return { valid: false, error: err.message }
    }
  })

  // ─── Version Compatibility / Migration ──────────────────
  handle('migration:version', () => migrationService.getCurrentVersion())
  handle('migration:matrix', () => migrationService.getCompatibilityMatrix())

  handleArg('migration:check', (arg: { filePath: string }) => {
    try {
      const data = smartExportService.loadExportFile(arg.filePath)
      return migrationService.checkCompatibility(data)
    } catch (err: any) {
      return { compatible: false, errors: [err.message] }
    }
  })

  handleArg('migration:migrate', (arg: { filePath: string }) => {
    try {
      const data = smartExportService.loadExportFile(arg.filePath)
      return migrationService.migrateData(data)
    } catch (err: any) {
      return { data: null, migrated: false, changes: [], error: err.message }
    }
  })

  handleArg('migration:dryRun', (arg: { filePath: string; options: any }) => {
    try {
      const data = smartExportService.loadExportFile(arg.filePath)
      return migrationService.dryRunImport(data, arg.options)
    } catch (err: any) {
      return { compatible: false, error: err.message }
    }
  })

  handle('migration:preBackup', () => {
    return migrationService.preImportBackup()
  })

  handleArg('migration:smartImport', (arg: { filePath: string; options: any; userName?: string }) => {
    try {
      const data = smartExportService.loadExportFile(arg.filePath)
      const migrated = migrationService.migrateData(data)
      const finalData = migrated.migrated ? migrated.data : data
      return smartExportService.smartImport(finalData, arg.options, arg.userName || 'user')
    } catch (err: any) {
      return { success: false, errors: [{ table: 'general', error: err.message }] }
    }
  })
}
