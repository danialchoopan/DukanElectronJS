export interface Product {
  id: number
  barcode: string
  title: string
  category: string
  unit: 'number' | 'weight'
  purchase_price: number
  sale_price: number
  stock: number
  minStock: number
  isLoose: boolean
  isActive: boolean
  description: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  barcode?: string
  title: string
  category?: string
  unit?: 'number' | 'weight'
  purchase_price: number
  sale_price: number
  stock: number
  minStock?: number
  isLoose?: boolean
  description?: string
  imageUrl?: string
}

export interface User {
  id: number
  name: string
  pin_code: string
  role: 'admin' | 'cashier'
  isActive: boolean
  createdAt: string
}

export interface CartItem {
  productId: number
  title: string
  unitPrice: number
  purchasePrice: number
  quantity: number
  maxStock: number
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  productTitle: string
  quantity: number
  unitPrice: number
  purchasePrice: number
  subtotal: number
  netProfit: number
}

export interface Sale {
  id: number
  invoiceNumber: string
  userId: number
  userName?: string
  items: SaleItem[]
  subtotal: number
  total_amount: number
  paymentMethod: 'cash' | 'card' | 'ledger'
  customerId?: number
  customerName?: string
  customerPaid: number
  changeAmount: number
  createdAt: string
}

export interface SaleInput {
  userId: number
  items: {
    productId: number
    productTitle: string
    quantity: number
    unitPrice: number
    purchasePrice: number
  }[]
  paymentMethod: 'cash' | 'card' | 'ledger'
  customerId?: number
  customerPaid: number
}

export interface Customer {
  id: number
  name: string
  phone: string
  balance: number
  createdAt: string
}

export interface CustomerInput {
  name: string
  phone: string
}

export interface CustomerLedgerEntry {
  id: number
  customerId: number
  saleId?: number
  type: 'charge' | 'payment' | 'sale'
  amount: number
  description: string
  createdAt: string
}

export interface Expense {
  id: number
  category: string
  description: string
  amount: number
  date: string
  createdAt: string
}

export interface ExpenseInput {
  category: string
  description: string
  amount: number
  date: string
}

export interface SuspendedInvoice {
  id: number
  userId: number
  slotIndex: number
  items: CartItem[]
  createdAt: string
}

export interface DailySummary {
  totalSales: number
  transactionCount: number
  cashTotal: number
  cardTotal: number
  ledgerTotal: number
}

export interface UserPerformance {
  userId: number
  userName: string
  invoiceCount: number
  totalSales: number
  totalProfit: number
}

export interface AppSettings {
  storeName: string
  storeAddress: string
  storePhone: string
  receiptFooter: string
  currency: string
  taxRate: number
  autoRounding: number
}

export interface DailyCashRegister {
  date: string
  openingBalance: number
  totalCashIn: number
  totalCashOut: number
  closingBalance: number
  expectedBalance: number
  difference: number
  isClosed: boolean
}

export interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: string
}
