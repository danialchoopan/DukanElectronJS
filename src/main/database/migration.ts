import { createBackup } from './backup'
import * as smartExport from './smartExport'

const CURRENT_VERSION = '1.0.0'

export interface CompatibilityResult {
  compatible: boolean
  fileVersion: string
  currentVersion: string
  needsMigration: boolean
  migrationSteps: MigrationStep[]
  warnings: string[]
  errors: string[]
}

export interface MigrationStep {
  fromVersion: string
  toVersion: string
  description: string
  table: string
  transform: (row: any) => any
}

export interface DryRunResult {
  compatible: boolean
  fileVersion: string
  currentVersion: string
  wouldImport: Record<string, number>
  wouldMigrate: string[]
  wouldSkip: string[]
  backupRequired: boolean
  warnings: string[]
}

interface VersionSchema {
  version: string
  tableColumns: Record<string, string[]>
}

const VERSION_SCHEMAS: VersionSchema[] = [
  {
    version: '0.9.0',
    tableColumns: {
      products: ['id', 'barcode', 'title', 'category', 'unit', 'purchase_price', 'sale_price', 'stock', 'minStock', 'isActive', 'createdAt'],
      customers: ['id', 'name', 'phone', 'balance', 'isActive', 'createdAt'],
      sales: ['id', 'invoiceNumber', 'userId', 'subtotal', 'total_amount', 'paymentMethod', 'createdAt'],
      sale_items: ['id', 'saleId', 'productId', 'productTitle', 'quantity', 'unitPrice', 'purchasePrice', 'subtotal'],
      users: ['id', 'name', 'pin_code', 'role', 'isActive', 'createdAt'],
      categories: ['id', 'name', 'level', 'parent_id', 'is_active', 'slug', 'createdAt'],
      settings: ['key', 'value'],
      expenses: ['id', 'category', 'description', 'amount', 'date', 'createdAt'],
    },
  },
  {
    version: '1.0.0',
    tableColumns: {
      products: ['id', 'barcode', 'title', 'description', 'imageBase64', 'category', 'unit', 'purchase_price', 'sale_price', 'stock', 'minStock', 'isLoose', 'isActive', 'createdAt', 'updatedAt'],
      customers: ['id', 'name', 'phone', 'balance', 'address', 'notes', 'customerType', 'description', 'imageBase64', 'totalSpent', 'totalPurchases', 'isActive', 'createdAt'],
      sales: ['id', 'invoiceNumber', 'userId', 'customerId', 'subtotal', 'total_amount', 'totalNetProfit', 'paymentMethod', 'customerPaid', 'changeAmount', 'createdAt'],
      sale_items: ['id', 'saleId', 'productId', 'productTitle', 'quantity', 'unitPrice', 'purchasePrice', 'subtotal', 'netProfit'],
      users: ['id', 'name', 'pin_code', 'role', 'isActive', 'createdAt'],
      categories: ['id', 'name', 'slug', 'level', 'parent_id', 'is_active', 'createdAt'],
      settings: ['key', 'value'],
      expenses: ['id', 'category', 'description', 'amount', 'date', 'imageBase64', 'images', 'createdAt'],
      customer_ledger: ['id', 'customerId', 'saleId', 'type', 'amount', 'description', 'images', 'createdAt'],
      returns: ['id', 'saleId', 'userId', 'productId', 'quantity', 'reason', 'refundAmount', 'status', 'createdAt'],
      accounts: ['id', 'code', 'name', 'type', 'parentId', 'isActive', 'description', 'createdAt'],
      journal_entries: ['id', 'entryDate', 'description', 'referenceType', 'referenceId', 'fiscalPeriodId', 'isPosted', 'createdBy', 'createdAt'],
      journal_entry_lines: ['id', 'entryId', 'accountId', 'debit', 'credit', 'description'],
      fiscal_periods: ['id', 'name', 'startDate', 'endDate', 'isClosed', 'closedAt', 'closedBy', 'createdAt'],
      cash_register: ['id', 'date', 'openingBalance', 'totalCashIn', 'totalCashOut', 'closingBalance', 'isClosed', 'closedAt', 'closedBy'],
      audit_log: ['id', 'userId', 'action', 'entityType', 'entityId', 'details', 'createdAt'],
    },
  },
]

export function detectFileVersion(data: smartExport.SmartExportPayload): string {
  if (data.version && data.version !== '2.0') return data.version
  if (!data.modules || data.modules.length === 0) return CURRENT_VERSION

  const hasOldProductFields = data.modules.some(m =>
    m.module === 'products' && m.tables.products?.[0] && !('description' in m.tables.products[0]) && !('imageBase64' in m.tables.products[0])
  )
  if (hasOldProductFields) return '0.9.0'

  const hasNewCustomerFields = data.modules.some(m =>
    m.module === 'customers' && m.tables.customers?.[0] && 'customerType' in m.tables.customers[0]
  )
  if (hasNewCustomerFields) return '1.0.0'

  return data.version || '1.0.0'
}

export function checkCompatibility(data: smartExport.SmartExportPayload): CompatibilityResult {
  const fileVersion = detectFileVersion(data)
  const currentVersion = CURRENT_VERSION
  const steps = getMigrationSteps(fileVersion, currentVersion)
  const warnings: string[] = []
  const errors: string[] = []

  if (fileVersion === currentVersion) {
    return { compatible: true, fileVersion, currentVersion, needsMigration: false, migrationSteps: [], warnings: [], errors: [] }
  }

  if (!isVersionSupported(fileVersion)) {
    errors.push(`نسخه فایل (${fileVersion}) پشتیبانی نمی‌شود`)
    return { compatible: false, fileVersion, currentVersion, needsMigration: false, migrationSteps: [], warnings, errors }
  }

  const versionCompare = compareVersions(fileVersion, currentVersion)
  if (versionCompare > 0) {
    warnings.push(`فایل مربوط به نسخه جدیدتر (${fileVersion}) است. ممکن است برخی داده‌ها قابل بازیابی نباشند.`)
  }

  if (steps.length > 0) {
    warnings.push(`فایل نیاز به مهاجرت دارد: از نسخه ${fileVersion} به ${currentVersion}`)
  }

  return {
    compatible: true,
    fileVersion,
    currentVersion,
    needsMigration: steps.length > 0,
    migrationSteps: steps,
    warnings,
    errors,
  }
}

function isVersionSupported(version: string): boolean {
  return VERSION_SCHEMAS.some(s => s.version === version)
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

function getMigrationSteps(fromVersion: string, toVersion: string): MigrationStep[] {
  const steps: MigrationStep[] = []

  if (compareVersions(fromVersion, '1.0.0') < 0 && compareVersions(toVersion, '1.0.0') >= 0) {
    steps.push({
      fromVersion: fromVersion,
      toVersion: '1.0.0',
      description: 'افزودن فیلدهای جدید به محصولات، مشتریان و فروش',
      table: 'products',
      transform: (row: any) => ({
        ...row,
        description: row.description ?? '',
        imageBase64: row.imageBase64 ?? '',
        isLoose: row.isLoose ?? 0,
        updatedAt: row.updatedAt ?? row.createdAt ?? '',
      }),
    })
    steps.push({
      fromVersion: fromVersion,
      toVersion: '1.0.0',
      description: 'افزودن فیلدهای نوع مشتری، آدرس و تصویر',
      table: 'customers',
      transform: (row: any) => ({
        ...row,
        address: row.address ?? '',
        notes: row.notes ?? '',
        customerType: row.customerType ?? 'real',
        description: row.description ?? '',
        imageBase64: row.imageBase64 ?? '',
        totalSpent: row.totalSpent ?? 0,
        totalPurchases: row.totalPurchases ?? 0,
      }),
    })
    steps.push({
      fromVersion: fromVersion,
      toVersion: '1.0.0',
      description: 'افزودن فیلدهای سود و مشتری به فاکتورها',
      table: 'sales',
      transform: (row: any) => ({
        ...row,
        customerId: row.customerId ?? null,
        totalNetProfit: row.totalNetProfit ?? 0,
        customerPaid: row.customerPaid ?? row.total_amount ?? 0,
        changeAmount: row.changeAmount ?? 0,
      }),
    })
    steps.push({
      fromVersion: fromVersion,
      toVersion: '1.0.0',
      description: 'افزودن فیلد سود خالص به اقلام فروش',
      table: 'sale_items',
      transform: (row: any) => ({
        ...row,
        netProfit: row.netProfit ?? 0,
      }),
    })
    steps.push({
      fromVersion: fromVersion,
      toVersion: '1.0.0',
      description: 'افزودن فیلدهای تصویر به هزینه‌ها',
      table: 'expenses',
      transform: (row: any) => ({
        ...row,
        imageBase64: row.imageBase64 ?? '',
        images: row.images ?? '[]',
      }),
    })
  }

  return steps
}

export function migrateData(data: smartExport.SmartExportPayload): { data: smartExport.SmartExportPayload; migrated: boolean; changes: string[] } {
  const compatibility = checkCompatibility(data)
  if (!compatibility.needsMigration) {
    return { data, migrated: false, changes: [] }
  }

  const changes: string[] = []
  const migratedModules = data.modules.map(mod => {
    const tables: Record<string, any[]> = {}

    for (const [tableName, rows] of Object.entries(mod.tables)) {
      const stepsForTable = compatibility.migrationSteps.filter(s => s.table === tableName)
      if (stepsForTable.length === 0) {
        tables[tableName] = rows
        continue
      }

      tables[tableName] = rows.map(row => {
        let migratedRow = { ...row }
        for (const step of stepsForTable) {
          migratedRow = step.transform(migratedRow)
          if (!changes.includes(step.description)) changes.push(step.description)
        }
        return migratedRow
      })
    }

    return { ...mod, tables }
  })

  return {
    data: { ...data, modules: migratedModules, version: CURRENT_VERSION },
    migrated: true,
    changes,
  }
}

export function dryRunImport(data: smartExport.SmartExportPayload, options: smartExport.ImportOptions): DryRunResult {
  const compatibility = checkCompatibility(data)
  const wouldImport: Record<string, number> = {}
  const wouldMigrate: string[] = []
  const wouldSkip: string[] = []
  const warnings: string[] = [...compatibility.warnings]

  let workingData = data
  if (compatibility.needsMigration) {
    const migrationResult = migrateData(data)
    workingData = migrationResult.data
    wouldMigrate.push(...migrationResult.changes)
  }

  for (const modData of workingData.modules) {
    const modName = modData.module as smartExport.DataModule
    if (!options.modules.includes(modName) && !smartExport.getModuleDependencies(options.modules).includes(modName)) {
      wouldSkip.push(modName)
      continue
    }

    for (const [table, rows] of Object.entries(modData.tables)) {
      if (!rows || rows.length === 0) continue
      wouldImport[table] = (wouldImport[table] || 0) + rows.length
    }
  }

  return {
    compatible: compatibility.compatible,
    fileVersion: compatibility.fileVersion,
    currentVersion: compatibility.currentVersion,
    wouldImport,
    wouldMigrate,
    wouldSkip,
    backupRequired: compatibility.needsMigration,
    warnings,
  }
}

export function preImportBackup(): { success: boolean; path?: string; error?: string } {
  try {
    const result = createBackup('pre-import')
    return { success: result.success, path: result.path, error: result.error }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export function getCompatibilityMatrix(): { version: string; compatible: boolean; notes: string }[] {
  const current = CURRENT_VERSION
  return [
    { version: '0.9.0', compatible: true, notes: 'نیاز به مهاجرت خودکار دارد — فیلدهای جدید با مقدار پیش‌فرض اضافه می‌شوند' },
    { version: '1.0.0', compatible: true, notes: 'نسخه فعلی — بدون نیاز به مهاجرت' },
  ].map(v => ({
    ...v,
    compatible: v.version === current || compareVersions(v.version, current) <= 0,
  }))
}

export function getCurrentVersion(): string {
  return CURRENT_VERSION
}
