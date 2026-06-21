import {
  checkCompatibility, detectFileVersion, migrateData, dryRunImport,
  getCurrentVersion, getCompatibilityMatrix
} from './migration'
import type { SmartExportPayload } from './smartExport'

function makePayload(version: string, modules: any[] = []): SmartExportPayload {
  return {
    version,
    timestamp: new Date().toISOString(),
    createdBy: 'test',
    modules: modules.length > 0 ? modules : [{
      module: 'products',
      tables: {
        products: [{ id: 1, title: 'Test', barcode: 'T1', purchase_price: 100, sale_price: 200, stock: 10, minStock: 5, category: '', unit: 'piece', isActive: 1, createdAt: '2026-01-01' }],
      },
      recordCount: 1,
    }],
    dependencies: [],
    signature: '',
    encrypted: false,
    checksum: '',
  }
}

export function runMigrationTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = []

  results.push(runTest('test_version_detection', () => {
    const v09 = makePayload('0.9.0')
    const detected = detectFileVersion(v09)
    if (detected !== '0.9.0') throw new Error(`Expected 0.9.0, got ${detected}`)

    const v10 = makePayload('1.0.0')
    const detected2 = detectFileVersion(v10)
    if (detected2 !== '1.0.0') throw new Error(`Expected 1.0.0, got ${detected2}`)
  }))

  results.push(runTest('test_auto_migration_on_import', () => {
    const oldPayload = makePayload('0.9.0', [{
      module: 'products',
      tables: {
        products: [{ id: 1, title: 'Test', barcode: 'T1', purchase_price: 100, sale_price: 200, stock: 10, minStock: 5, category: '', unit: 'piece', isActive: 1, createdAt: '2026-01-01' }],
      },
      recordCount: 1,
    }])
    const migrated = migrateData(oldPayload)
    if (!migrated.migrated) throw new Error('Should have migrated')
    if (migrated.changes.length === 0) throw new Error('Expected migration changes')
    const productRow = migrated.data.modules[0].tables.products[0]
    if (!('description' in productRow)) throw new Error('Missing description field after migration')
    if (!('imageBase64' in productRow)) throw new Error('Missing imageBase64 field after migration')
  }))

  results.push(runTest('test_import_from_old_version', () => {
    const oldPayload = makePayload('0.9.0', [{
      module: 'customers',
      tables: {
        customers: [{ id: 1, name: 'Ali', phone: '0912', balance: 0, isActive: 1, createdAt: '2026-01-01' }],
      },
      recordCount: 1,
    }])
    const migrated = migrateData(oldPayload)
    if (!migrated.migrated) throw new Error('Should have migrated')
    const customerRow = migrated.data.modules[0].tables.customers[0]
    if (customerRow.address !== '') throw new Error('address should be empty default')
    if (customerRow.customerType !== 'real') throw new Error('customerType should default to real')
    if (customerRow.totalSpent !== 0) throw new Error('totalSpent should default to 0')
  }))

  results.push(runTest('test_compatibility_check_before_import', () => {
    const supported = makePayload('0.9.0')
    const compat = checkCompatibility(supported)
    if (!compat.compatible) throw new Error('0.9.0 should be compatible')
    if (!compat.needsMigration) throw new Error('0.9.0 should need migration')

    const current = makePayload('1.0.0')
    const compat2 = checkCompatibility(current)
    if (!compat2.compatible) throw new Error('1.0.0 should be compatible')
    if (compat2.needsMigration) throw new Error('1.0.0 should not need migration')
  }))

  results.push(runTest('test_import_with_missing_fields', () => {
    const oldPayload = makePayload('0.9.0', [{
      module: 'products',
      tables: {
        products: [{ id: 1, title: 'OldProduct', barcode: 'OP1', purchase_price: 50, sale_price: 100, stock: 5, minStock: 2, category: '', unit: 'piece', isActive: 1, createdAt: '2026-01-01' }],
      },
      recordCount: 1,
    }])
    const migrated = migrateData(oldPayload)
    const row = migrated.data.modules[0].tables.products[0]
    if (row.description !== '') throw new Error('Missing fields should have defaults')
    if (row.imageBase64 !== '') throw new Error('imageBase64 should default to empty')
    if (row.isLoose !== 0) throw new Error('isLoose should default to 0')
  }))

  results.push(runTest('test_import_with_extra_fields', () => {
    const payload = makePayload('1.0.0', [{
      module: 'products',
      tables: {
        products: [{ id: 1, title: 'Test', barcode: 'T1', purchase_price: 100, sale_price: 200, stock: 10, minStock: 5, category: '', unit: 'piece', isActive: 1, createdAt: '2026-01-01', unknownField: 'should be ignored', anotherExtra: 42 }],
      },
      recordCount: 1,
    }])
    const migrated = migrateData(payload)
    if (migrated.migrated) throw new Error('Same version should not migrate')
    const row = migrated.data.modules[0].tables.products[0]
    if (!('unknownField' in row)) throw new Error('Extra fields should be preserved (ignored at insert time)')
    if (row.anotherExtra !== 42) throw new Error('Extra fields preserved')
  }))

  results.push(runTest('test_version_mismatch_warning', () => {
    const oldPayload = makePayload('0.9.0')
    const compat = checkCompatibility(oldPayload)
    if (compat.warnings.length === 0) throw new Error('Should have version mismatch warning')
    if (!compat.warnings.some(w => w.includes('0.9.0'))) throw new Error('Warning should mention file version')
  }))

  results.push(runTest('test_dry_run_import', () => {
    const oldPayload = makePayload('0.9.0', [{
      module: 'products',
      tables: {
        products: [{ id: 1, title: 'Test', barcode: 'T1', purchase_price: 100, sale_price: 200, stock: 10, minStock: 5, category: '', unit: 'piece', isActive: 1, createdAt: '2026-01-01' }],
      },
      recordCount: 1,
    }])
    const dry = dryRunImport(oldPayload, { modules: ['products'], conflictResolution: 'skip', validate: true })
    if (!dry.compatible) throw new Error('Should be compatible')
    if (dry.fileVersion !== '0.9.0') throw new Error('Should detect file version')
    if (!dry.wouldMigrate || dry.wouldMigrate.length === 0) throw new Error('Should list migration steps')
    if (!dry.backupRequired) throw new Error('Should require backup for migration')
  }))

  results.push(runTest('test_version_matrix', () => {
    const matrix = getCompatibilityMatrix()
    if (!Array.isArray(matrix) || matrix.length < 2) throw new Error('Matrix should have at least 2 versions')
    const current = matrix.find(m => m.version === getCurrentVersion())
    if (!current) throw new Error('Matrix should include current version')
  }))

  return results
}

function runTest(name: string, fn: () => void): { name: string; passed: boolean; error?: string } {
  try {
    fn()
    return { name, passed: true }
  } catch (err) {
    return { name, passed: false, error: err instanceof Error ? err.message : String(err) }
  }
}
