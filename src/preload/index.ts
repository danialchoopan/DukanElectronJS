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
    updateStock: (productId: number, quantityChange: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('products:updateStock', { productId, quantityChange }),
    getLowStock: (): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:lowStock'),
    getLoose: (): Promise<IPCResponse<Product[]>> =>
      ipcRenderer.invoke('products:loose'),
    getCategories: (): Promise<IPCResponse<string[]>> =>
      ipcRenderer.invoke('products:categories'),
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
    charge: (customerId: number, amount: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('customers:charge', { customerId, amount }),
    pay: (customerId: number, amount: number): Promise<VoidResponse> =>
      ipcRenderer.invoke('customers:pay', { customerId, amount }),
    getLedger: (customerId: number): Promise<IPCResponse<CustomerLedgerEntry[]>> =>
      ipcRenderer.invoke('customers:ledger', { customerId }),
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
    set: (key: string, value: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('settings:set', { key, value }),
  },

  backup: {
    export: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('backup:export'),
    import: (): Promise<IPCResponse<boolean>> =>
      ipcRenderer.invoke('backup:import'),
  },

  onNavigate: (callback: (page: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, page: string): void => callback(page)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },
}

contextBridge.exposeInMainWorld('api', api)
export type BroAppAPI = typeof api
