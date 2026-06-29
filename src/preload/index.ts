/**
 * Preload bridge — exposes a safe, typed API from main process to renderer.
 *
 * This file runs in the preload context (before the renderer). It uses
 * contextBridge.exposeInMainWorld to create window.api with namespaces:
 *
 *   window.api.auth          — User login, CRUD, PIN management
 *   window.api.products      — Product CRUD, stock, barcode, images
 *   window.api.sales         — Sale creation and analytics
 *   window.api.customers     — Customer CRUD and ledger
 *   window.api.suppliers     — Supplier CRUD and purchases
 *   window.api.expenses      — Expense management
 *   window.api.returns       — Product returns
 *   window.api.accounts      — Chart of accounts
 *   window.api.journal       — Double-entry journal
 *   window.api.reports       — Financial reports
 *   window.api.categories    — Category hierarchy
 *   window.api.settings      — Key-value settings
 *   window.api.backup        — Backup/restore/export/import
 *   window.api.smartExport   — Selective data export
 *   window.api.smartImport   — Selective data import
 *   window.api.migration     — Version detection and data migration
 *   window.api.inventory     — Stock adjustments
 *   window.api.system        — First-run detection
 *   window.api.suspend       — Invoice suspension (hold/resume)
 *   window.api.dialog        — Native OS file dialogs
 *   window.api.audit         — Audit log queries
 *   window.api.printSettings — Print customization
 *
 * All methods return Promise<IPCResponse<T>> for consistent error handling.
 * The BroAppAPI type is exported for use in renderer type-checking.
 */

import { contextBridge, ipcRenderer } from 'electron'
import type {
  ProductInput, SaleInput, CustomerInput, ExpenseInput,
  Product, Sale, User, CartItem, SuspendedInvoice,
  IPCResponse, DailySummary, UserPerformance,
  Customer, CustomerLedgerEntry, Expense, DailyCashRegister,
} from '../types'

type VoidResponse = IPCResponse<boolean>

const api = {
  system: {
    isFirstRun: (): Promise<IPCResponse<{ isFirstRun: boolean }>> =>
      ipcRenderer.invoke('system:isFirstRun'),
  },

  auth: {
    login: (pinCode: string): Promise<IPCResponse<User>> =>
      ipcRenderer.invoke('auth:login', { pinCode }),
    listUsers: (): Promise<IPCResponse<User[]>> =>
      ipcRenderer.invoke('auth:listUsers'),
    createUser: (data: { name: string; pinCode: string; role: 'admin' | 'cashier' }): Promise<IPCResponse<User>> =>
      ipcRenderer.invoke('auth:createUser', data),
    deleteUser: (id: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('auth:deleteUser', { id }),
    changePin: (id: number, newPin: string): Promise<VoidResponse> =>
      ipcRenderer.invoke('auth:changePin', { id, newPin }),
    updateUser: (id: number, data: { name?: string; pinCode?: string; role?: 'admin' | 'cashier' }): Promise<VoidResponse> =>
      ipcRenderer.invoke('auth:updateUser', { id, ...data }),
  },

  products: {
    getAll: (): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:getAll'),
    getById: (id: number): Promise<IPCResponse<Product | undefined>> =>
      ipcRenderer.invoke('products:getById', { id }),
    getByBarcode: (barcode: string): Promise<IPCResponse<Product | undefined>> =>
      ipcRenderer.invoke('products:getByBarcode', { barcode }),
    search: (query: string): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:search', { query }),
    create: (data: ProductInput): Promise<IPCResponse<Product>> =>
      ipcRenderer.invoke('products:create', data),
    update: (id: number, data: Partial<ProductInput>): Promise<IPCResponse<Product | undefined>> =>
      ipcRenderer.invoke('products:update', { id, data }),
    delete: (id: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('products:delete', { id }),
    updateStock: (productId: number, quantityChange: number, reason?: string): Promise<VoidResponse> =>
      ipcRenderer.invoke('products:updateStock', { productId, quantityChange, reason }),
    getLowStock: (): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:lowStock'),
    getLoose: (): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:loose'),
    getCategories: (): Promise<IPCResponse<string[]>> =>
      ipcRenderer.invoke('products:categories'),
    getSellable: (): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:getSellable'),
    getExpiring: (withinDays?: number): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('products:expiring', { withinDays: withinDays ?? 30 }),
    markAlerted: (id: number): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('products:markAlerted', { id }),
    resetAlerts: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('products:resetAlerts'),
    getProfitReport: (startDate?: string, endDate?: string): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('products:profitReport', { startDate, endDate }),
    getReportData: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('products:reportData'),
    saveImage: (data: { base64: string; productId: number }): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('products:saveImage', data),
    getImage: (filename: string): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('products:getImage', { filename }),
    bulkImport: (products: any[]): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('products:bulkImport', { products }),
  },

  sales: {
    create: (data: SaleInput): Promise<IPCResponse<Sale>> =>
      ipcRenderer.invoke('sales:create', data),
    getById: (id: number): Promise<IPCResponse<Sale | undefined>> =>
      ipcRenderer.invoke('sales:getById', { id }),
    getByDateRange: (startDate: string, endDate: string): Promise<IPCResponse<Sale[]>> =>
      ipcRenderer.invoke('sales:getByDateRange', { startDate, endDate }),
    getDailySummary: (date: string): Promise<IPCResponse<DailySummary>> =>
      ipcRenderer.invoke('sales:dailySummary', { date }),
    getUserPerformance: (startDate?: string, endDate?: string): Promise<IPCResponse<UserPerformance[]>> =>
      ipcRenderer.invoke('sales:userPerformance', { startDate: startDate ?? null, endDate: endDate ?? null }),
    getTopProducts: (startDate?: string, endDate?: string): Promise<IPCResponse<{ productTitle: string; totalQty: number; totalRevenue: number }[]>> =>
      ipcRenderer.invoke('sales:topProducts', { startDate: startDate ?? null, endDate: endDate ?? null }),
  },

  customers: {
    getAll: (): Promise<IPCResponse<Customer[]>> =>
      ipcRenderer.invoke('customers:getAll'),
    getById: (id: number): Promise<IPCResponse<Customer | undefined>> =>
      ipcRenderer.invoke('customers:getById', { id }),
    search: (query: string): Promise<IPCResponse<Customer[]>> =>
      ipcRenderer.invoke('customers:search', { query }),
    create: (data: CustomerInput): Promise<IPCResponse<Customer>> =>
      ipcRenderer.invoke('customers:create', data),
    update: (id: number, data: Partial<CustomerInput>): Promise<IPCResponse<Customer | undefined>> =>
      ipcRenderer.invoke('customers:update', { id, data }),
    delete: (id: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('customers:delete', { id }),
    charge: (customerId: number, amount: number, description?: string, images?: string[]): Promise<VoidResponse> =>
      ipcRenderer.invoke('customers:charge', { customerId, amount, description, images }),
    pay: (customerId: number, amount: number, description?: string, images?: string[]): Promise<VoidResponse> =>
      ipcRenderer.invoke('customers:pay', { customerId, amount, description, images }),
    getLedger: (customerId: number): Promise<IPCResponse<CustomerLedgerEntry[]>> =>
      ipcRenderer.invoke('customers:ledger', { customerId }),
    getStats: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('customers:stats'),
    getWithStats: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('customers:getWithStats', { id }),
    purchaseHistory: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('customers:purchaseHistory', { id }),
    getAllWithStats: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('customers:getAllWithStats'),
    deleteSoft: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('customers:deleteSoft', { id }),
    deleteLedgerEntry: (entryId: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('customers:deleteLedgerEntry', { entryId }),
    saveImage: (data: { base64: string; customerId: number }): Promise<IPCResponse<string>> => ipcRenderer.invoke('customers:saveImage', data),
  },

  expenses: {
    getAll: (): Promise<IPCResponse<Expense[]>> =>
      ipcRenderer.invoke('expenses:getAll'),
    getByDateRange: (startDate: string, endDate: string): Promise<IPCResponse<Expense[]>> =>
      ipcRenderer.invoke('expenses:getByDateRange', { startDate, endDate }),
    create: (data: ExpenseInput): Promise<IPCResponse<Expense>> =>
      ipcRenderer.invoke('expenses:create', data),
    delete: (id: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('expenses:delete', { id }),
    getCategories: (): Promise<IPCResponse<string[]>> =>
      ipcRenderer.invoke('expenses:categories'),
    getTotal: (): Promise<IPCResponse<number>> =>
      ipcRenderer.invoke('expenses:total'),
    saveImage: (data: { base64: string; expenseId: number }): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('expenses:saveImage', data),
  },

  cashRegister: {
    getToday: (): Promise<IPCResponse<DailyCashRegister>> =>
      ipcRenderer.invoke('cashRegister:getToday'),
    setOpening: (amount: number): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('cashRegister:setOpening', { amount }),
    close: (userId: number, closingBalance: number): Promise<IPCResponse<DailyCashRegister>> =>
      ipcRenderer.invoke('cashRegister:close', { userId, closingBalance }),
  },

  suspend: {
    save: (userId: number, slotIndex: number, items: CartItem[]): Promise<IPCResponse<SuspendedInvoice>> =>
      ipcRenderer.invoke('suspend:save', { userId, slotIndex, items }),
    list: (userId?: number): Promise<IPCResponse<SuspendedInvoice[]>> =>
      ipcRenderer.invoke('suspend:list', { userId: userId ?? null }),
    load: (id: number): Promise<IPCResponse<SuspendedInvoice | undefined>> =>
      ipcRenderer.invoke('suspend:load', { id }),
    delete: (id: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('suspend:delete', { id }),
  },

  settings: {
    getAll: (): Promise<IPCResponse<Record<string, string>>> =>
      ipcRenderer.invoke('settings:getAll'),
    get: (key: string): Promise<IPCResponse<string | null>> =>
      ipcRenderer.invoke('settings:get', { key }),
    set: (key: string, value: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('settings:set', { key, value }),
  },

  printSettings: {
    getAll: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('printSettings:getAll'),
    save: (settings: Record<string, string>): Promise<IPCResponse<any>> => ipcRenderer.invoke('printSettings:save', { settings }),
    reset: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('printSettings:reset'),
    uploadAsset: (type: string, base64: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('printSettings:uploadAsset', { type, base64 }),
    getAsset: (filename: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('printSettings:getAsset', { filename }),
  },

  categories: {
    getAll: (): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('categories:getAll'),
    getTree: (): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('categories:getTree'),
    create: (data: { name: string; parentId?: number }): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('categories:create', data),
    update: (id: number, data: { name?: string; slug?: string; isActive?: boolean }): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('categories:update', { id, data }),
    delete: (id: number): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('categories:delete', { id }),
    toggleActive: (id: number): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('categories:toggleActive', { id }),
    getDescendants: (id: number): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('categories:descendants', { id }),
    getSubcategories: (parentId: number): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('categories:getSubcategories', { parentId }),
  },

  audit: {
    getAll: (entityType?: string, limit?: number, startDate?: string, endDate?: string): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('audit:getAll', { entityType, limit, startDate, endDate }),
    getForEntity: (entityType: string, entityId: number): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('audit:getForEntity', { entityType, entityId }),
    getStats: (): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('audit:stats'),
  },

  returns: {
    create: (data: { saleId: number; userId: number; productId: number; quantity: number; reason: string; refundAmount: number }): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('returns:create', data),
    list: (limit?: number): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('returns:list', { limit }),
    getStats: (): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('returns:stats'),
  },

  inventory: {
    create: (data: { productId: number; newStock: number; reason: string; adjustmentType: string; createdBy?: string; createdAt?: string }): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('inventory:create', data),
    getAll: (filters?: { productId?: number; adjustmentType?: string; dateFrom?: string; dateTo?: string; limit?: number }): Promise<IPCResponse<any[]>> =>
      ipcRenderer.invoke('inventory:getAll', filters || {}),
    getById: (id: number): Promise<IPCResponse<any>> =>
      ipcRenderer.invoke('inventory:getById', { id }),
  },

  accounts: {
    getAll: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:getAll'),
    getTree: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:getTree'),
    getById: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:getById', { id }),
    getByType: (type: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:getByType', { type }),
    create: (data: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:create', data),
    update: (id: number, data: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:update', { id, data }),
    delete: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:delete', { id }),
    toggleActive: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounts:toggleActive', { id }),
  },
  journal: {
    getEntries: (filters: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('journal:entries', filters),
    getById: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('journal:getById', { id }),
    create: (data: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('journal:create', data),
    getTrialBalance: (startDate?: string, endDate?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('journal:trialBalance', { startDate, endDate }),
    getLedger: (accountId: number, startDate?: string, endDate?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('journal:ledger', { accountId, startDate, endDate }),
  },
  reports: {
    getProfitLoss: (startDate?: string, endDate?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('reports:profitLoss', { startDate, endDate }),
    getBalanceSheet: (asOfDate?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('reports:balanceSheet', { asOfDate }),
    getARAging: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('reports:arAging'),
    getCashFlow: (startDate?: string, endDate?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('reports:cashFlow', { startDate, endDate }),
  },
  periods: {
    getAll: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('periods:getAll'),
    getActive: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('periods:getActive'),
    close: (id: number, userId: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('periods:close', { id, userId }),
    reopen: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('periods:reopen', { id }),
    create: (data: { name: string; startDate: string; endDate: string }): Promise<IPCResponse<any>> => ipcRenderer.invoke('periods:create', data),
  },
  accounting: {
    migrate: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounting:migrate'),
    seedDemo: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('accounting:seedDemo'),
  },

  backup: {
    export: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('backup:export'),
    import: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('backup:import'),
    create: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:create'),
    auto: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:auto'),
    list: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:list'),
    stats: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:stats'),
    integrity: (path?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:integrity', { path }),
    verify: (path: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:verify', { path }),
    restore: (path: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:restore', { path }),
    cleanup: (keepCount?: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:cleanup', { keepCount }),
    getDetails: (path: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:details', { path }),
    checkVersion: (path: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:checkVersion', { path }),
    tableStats: (path: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:tableStats', { path }),
    runTests: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:runTests'),
    delete: (name: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:delete', { name }),
    saveAs: (): Promise<IPCResponse<string>> => ipcRenderer.invoke('backup:saveAs'),
    getSelectableTables: (): Promise<IPCResponse<{ name: string; rowCount: number }[]>> => ipcRenderer.invoke('backup:getSelectableTables'),
    createWithOptions: (options: { format: string; scope: string; tables?: string[]; filePath?: string; label?: string }): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('backup:createWithOptions', options),
  },

  database: {
    reset: (): Promise<IPCResponse<boolean>> => ipcRenderer.invoke('database:reset'),
  },

  dialog: {
    openBackup: (): Promise<IPCResponse<string>> => ipcRenderer.invoke('dialog:openBackup'),
    openSmartExport: (): Promise<IPCResponse<string>> => ipcRenderer.invoke('dialog:openSmartExport'),
    openSmartImport: (): Promise<IPCResponse<string>> => ipcRenderer.invoke('dialog:openSmartImport'),
  },

  smartExport: {
    modules: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartExport:modules'),
    presets: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartExport:presets'),
    dependencies: (modules: string[]): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartExport:dependencies', modules),
    execute: (options: any, userName?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartExport:execute', { options, userName }),
    save: (data: any, filePath: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartExport:save', { data, filePath }),
    runTests: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartExport:runTests'),
    runMigrationTests: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:runTests'),
  },

  smartImport: {
    preview: (filePath: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartImport:preview', { filePath }),
    execute: (data: any, options: any, userName?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartImport:execute', { data, options, userName }),
    validate: (filePath: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('smartImport:validate', { filePath }),
  },

  migration: {
    version: (): Promise<IPCResponse<string>> => ipcRenderer.invoke('migration:version'),
    matrix: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:matrix'),
    check: (filePath: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:check', { filePath }),
    migrate: (filePath: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:migrate', { filePath }),
    dryRun: (filePath: string, options: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:dryRun', { filePath, options }),
    preBackup: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:preBackup'),
    smartImport: (filePath: string, options: any, userName?: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('migration:smartImport', { filePath, options, userName }),
  },

  suppliers: {
    getAll: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:getAll'),
    getById: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:getById', { id }),
    search: (query: string): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:search', { query }),
    create: (input: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:create', input),
    update: (id: number, data: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:update', { id, data }),
    delete: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:delete', { id }),
    stats: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:stats'),
    ledger: (supplierId: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:ledger', { supplierId }),
    deleteLedgerEntry: (entryId: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:deleteLedgerEntry', { entryId }),
    pay: (supplierId: number, amount: number, description?: string, purchaseId?: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('suppliers:pay', { supplierId, amount, description, purchaseId }),
  },

  purchases: {
    getAll: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('purchases:getAll'),
    getById: (id: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('purchases:getById', { id }),
    getBySupplier: (supplierId: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('purchases:getBySupplier', { supplierId }),
    create: (input: any): Promise<IPCResponse<any>> => ipcRenderer.invoke('purchases:create', { input }),
    stats: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('purchases:stats'),
    return: (purchaseId: number, items: any[]): Promise<IPCResponse<any>> => ipcRenderer.invoke('purchases:return', { purchaseId, items }),
  },

  priceHistory: {
    get: (params: { productId?: number; priceType?: string; startDate?: string; endDate?: string }): Promise<IPCResponse<any>> => ipcRenderer.invoke('priceHistory:get', params),
    latest: (): Promise<IPCResponse<any>> => ipcRenderer.invoke('priceHistory:latest'),
    byProduct: (productId: number): Promise<IPCResponse<any>> => ipcRenderer.invoke('priceHistory:byProduct', { productId }),
  },

  onNavigate: (callback: (page: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, page: string): void => callback(page)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },
}

contextBridge.exposeInMainWorld('api', api)
export type BroAppAPI = typeof api
