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
  imageBase64: string
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
  imageBase64?: string
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
  imageBase64: string
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
  address: string
  notes: string
  isActive: boolean
  createdAt: string
  purchaseCount?: number
  lastPurchaseDate?: string | null
  totalSpent?: number
}

export interface CustomerInput {
  name: string
  phone: string
  address?: string
  notes?: string
}

export interface CustomerLedgerEntry {
  id: number
  customerId: number
  saleId?: number
  type: 'charge' | 'payment' | 'sale'
  amount: number
  description: string
  images: string[]
  createdAt: string
}

export interface Expense {
  id: number
  category: string
  description: string
  amount: number
  date: string
  images: string[]
  imageBase64?: string
  createdAt: string
}

export interface ExpenseInput {
  category: string
  description: string
  amount: number
  date: string
  images?: string[]
  imageBase64?: string
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

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export interface Account {
  id: number; code: string; name: string; type: AccountType
  parentId: number | null; isActive: boolean; description: string; createdAt: string
}

export interface CreateAccountInput {
  code: string; name: string; type: AccountType
  parentId?: number | null; description?: string
}

export interface AccountTreeNode {
  account: Account; children: AccountTreeNode[]
}

export interface FiscalPeriod {
  id: number; name: string; startDate: string; endDate: string
  isClosed: boolean; closedAt: string | null; closedBy: number | null; createdAt: string
}

export interface JournalEntry {
  id: number; entryDate: string; description: string
  referenceType: string | null; referenceId: number | null
  fiscalPeriodId: number | null; isPosted: boolean
  createdBy: number | null; createdAt: string
}

export interface JournalLine {
  id: number; entryId: number; accountId: number
  debit: number; credit: number; description: string
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalLine[]
}

export interface TrialBalanceRow {
  accountId: number; accountCode: string; accountName: string; accountType: string
  totalDebit: number; totalCredit: number; balance: number
}

export interface LedgerRow {
  entryDate: string; description: string; referenceType: string
  debit: number; credit: number; balance: number
}

export interface ProfitLossLine {
  accountCode: string; accountName: string; amount: number
}

export interface ProfitLossReport {
  revenue: ProfitLossLine[]; totalRevenue: number
  cogs: ProfitLossLine[]; totalCogs: number; grossProfit: number
  operatingExpenses: ProfitLossLine[]; totalOperatingExpenses: number
  netProfit: number
}

export interface BalanceSheetSection {
  accountCode: string; accountName: string; amount: number
}

export interface BalanceSheetReport {
  currentAssets: BalanceSheetSection[]; totalCurrentAssets: number
  longTermAssets: BalanceSheetSection[]; totalLongTermAssets: number
  totalAssets: number
  currentLiabilities: BalanceSheetSection[]; totalCurrentLiabilities: number
  longTermLiabilities: BalanceSheetSection[]; totalLongTermLiabilities: number
  totalLiabilities: number
  equityItems: BalanceSheetSection[]; totalEquity: number
  totalLiabilitiesAndEquity: number
}

export interface ARAgingRow {
  customerId: number; customerName: string; phone: string
  current: number; days31to60: number; days61to90: number; over90: number; total: number
}

export interface ARAgingReport {
  rows: ARAgingRow[]
  totals: { current: number; days31to60: number; days61to90: number; over90: number; total: number }
}
