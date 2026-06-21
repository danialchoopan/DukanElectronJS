import {
  smartExport, smartImport, verifySignature, getExportModuleList, getExportPresets,
  getModuleDependencies, getModuleWarnings,
  type ExportOptions, type ImportOptions, type SmartExportPayload
} from './smartExport'
import { getDatabase } from './connection'

export function runSmartExportTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = []

  results.push(runTest('test_export_full_data', () => {
    const opts: ExportOptions = {
      modules: ['products', 'customers', 'categories', 'users', 'settings', 'sales', 'expenses', 'returns', 'accounts', 'journal', 'fiscal_periods', 'cash_register'],
      includeImages: true,
    }
    const result = smartExport(opts, 'test')
    if (!result.success) throw new Error(`smartExport failed: ${result.error}`)
    if (!result.data) throw new Error('No data returned')
    if (!result.data.modules || result.data.modules.length === 0) throw new Error('No modules in export')
    if (!result.data.signature) throw new Error('No signature')
    if (!result.data.checksum) throw new Error('No checksum')
    if (result.data.version !== '2.0') throw new Error(`Unexpected version: ${result.data.version}`)
  }))

  results.push(runTest('test_export_selected_modules', () => {
    const opts: ExportOptions = {
      modules: ['settings'],
      includeImages: false,
    }
    const result = smartExport(opts, 'test')
    if (!result.success) throw new Error(`smartExport failed: ${result.error}`)
    if (!result.data) throw new Error('No data returned')
    const settingsMod = result.data.modules.find(m => m.module === 'settings')
    if (!settingsMod) throw new Error('Settings module not found')
    const salesMod = result.data.modules.find(m => m.module === 'sales')
    if (salesMod) throw new Error('Sales module should not be in export')
    const productsMod = result.data.modules.find(m => m.module === 'products')
    if (productsMod) throw new Error('Products module should not be in settings-only export')
  }))

  results.push(runTest('test_import_dependency_detection', () => {
    const deps = getModuleDependencies(['sales'])
    if (!deps.includes('products')) throw new Error('Sales should depend on products')
    if (!deps.includes('customers')) throw new Error('Sales should depend on customers')
    if (!deps.includes('users')) throw new Error('Sales should depend on users')
  }))

  results.push(runTest('test_import_dependency_warnings', () => {
    const warnings = getModuleWarnings(['sales'])
    if (warnings.length === 0) throw new Error('Expected warnings when exporting sales without customers')
  }))

  results.push(runTest('test_import_with_selected_modules', () => {
    const opts: ExportOptions = { modules: ['products'], includeImages: false }
    const exportResult = smartExport(opts, 'test')
    if (!exportResult.success || !exportResult.data) throw new Error('Export failed')

    const db = getDatabase()
    const origSalesCount = (db.prepare('SELECT COUNT(*) as c FROM sales').get() as any).c

    const importOpts: ImportOptions = {
      modules: ['products'],
      conflictResolution: 'skip',
      validate: true,
    }
    const importResult = smartImport(exportResult.data, importOpts, 'test')
    if (!importResult.success) throw new Error(`Import failed: ${JSON.stringify(importResult.errors)}`)
    const newSalesCount = (db.prepare('SELECT COUNT(*) as c FROM sales').get() as any).c
    if (newSalesCount !== origSalesCount) throw new Error('Sales count changed during product-only import')
  }))

  results.push(runTest('test_import_invalid_data', () => {
    const badData = { version: '2.0', timestamp: '', createdBy: 'test', modules: 'not-an-array', dependencies: [], signature: '', checksum: '', encrypted: false } as any
    const opts: ImportOptions = { modules: ['products'], conflictResolution: 'replace', validate: true }
    const result = smartImport(badData, opts, 'test')
    if (result.success) throw new Error('Import of invalid data should fail')
    if (result.errors.length === 0) throw new Error('Expected errors for invalid data')
  }))

  results.push(runTest('test_import_atomic_rollback', () => {
    const db = getDatabase()
    const origProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c
    const badData: SmartExportPayload = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      createdBy: 'test',
      modules: [{
        module: 'products',
        tables: { products: [{ id: 999999, title: 'should not exist', barcode: 'BAD' }] },
        recordCount: 1,
      }],
      dependencies: [],
      signature: '',
      checksum: '',
      encrypted: false,
    }
    const opts: ImportOptions = { modules: ['products'], conflictResolution: 'replace', validate: false }
    const result = smartImport(badData, opts, 'test')
    const afterProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c
    if (afterProducts !== origProducts && result.success) throw new Error('Transaction should rollback')
  }))

  results.push(runTest('test_signature_verification', () => {
    const opts: ExportOptions = { modules: ['settings'], includeImages: false }
    const result = smartExport(opts, 'test')
    if (!result.success || !result.data) throw new Error('Export failed')
    const sigResult = verifySignature(result.data)
    if (!sigResult.valid) throw new Error(`Signature should be valid: ${sigResult.reason}`)
  }))

  results.push(runTest('test_signature_tampered', () => {
    const opts: ExportOptions = { modules: ['settings'], includeImages: false }
    const result = smartExport(opts, 'test')
    if (!result.success || !result.data) throw new Error('Export failed')
    const tampered = { ...result.data, checksum: 'tampered' }
    const sigResult = verifySignature(tampered)
    if (sigResult.valid) throw new Error('Signature should be invalid for tampered data')
  }))

  results.push(runTest('test_integrity_after_import', () => {
    const opts: ExportOptions = { modules: ['categories'], includeImages: false }
    const result = smartExport(opts, 'test')
    if (!result.success || !result.data) throw new Error('Export failed')
    const importOpts: ImportOptions = { modules: ['categories'], conflictResolution: 'skip', validate: true }
    const importResult = smartImport(result.data, importOpts, 'test')
    if (!importResult.success) throw new Error(`Import failed: ${JSON.stringify(importResult.errors)}`)
    if (!importResult.integrityPassed) throw new Error('Integrity check should pass after import')
  }))

  results.push(runTest('test_module_list', () => {
    const modules = getExportModuleList()
    if (!Array.isArray(modules) || modules.length < 10) throw new Error('Expected at least 10 modules')
    for (const m of modules) {
      if (!m.key || !m.label || !m.tables || !m.description) throw new Error('Module missing required fields')
    }
  }))

  results.push(runTest('test_export_presets', () => {
    const presets = getExportPresets()
    if (!Array.isArray(presets) || presets.length < 4) throw new Error('Expected at least 4 presets')
    const allPreset = presets.find(p => p.key === 'all')
    if (!allPreset) throw new Error('Missing "all" preset')
    if (allPreset.modules.length < 10) throw new Error('"all" preset should include most modules')
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
