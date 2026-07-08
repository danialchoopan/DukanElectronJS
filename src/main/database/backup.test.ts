import { createBackup, listBackups, verifyBackup, getBackupStats, cleanupBackups, getTableStats, checkBackupVersion, getBackupDetails } from './backup'
import { existsSync, unlinkSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const BACKUP_DIR = join(app.getPath('userData'), 'backups')

function cleanTestBackups(): void {
  const files = readdirSync(BACKUP_DIR).filter(f => f.startsWith('test-'))
  for (const f of files) {
    try { unlinkSync(join(BACKUP_DIR, f)) } catch {}
  }
}

export function runBackupTests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = []

  results.push(runTest('test_backup_creates_valid_file', () => {
    const result = createBackup('test-backup-valid')
    if (!result.success) throw new Error(`createBackup failed: ${result.error}`)
    if (!result.path) throw new Error('createBackup returned no path')
    if (!existsSync(result.path)) throw new Error('Backup file does not exist')
    if (!result.hash || result.hash.length !== 64) throw new Error('Invalid hash')
    if (!result.size || result.size <= 0) throw new Error('Invalid size')
  }))

  results.push(runTest('test_backup_includes_all_tables', () => {
    const stats = getTableStats()
    const expectedTables = ['users', 'products', 'customers', 'categories', 'sales', 'sale_items', 'customer_ledger', 'expenses', 'suspended_invoices', 'cash_register', 'settings', 'audit_log', 'returns', 'fiscal_periods', 'accounts', 'journal_entries', 'journal_entry_lines']
    for (const t of expectedTables) {
      if (!(t in stats)) throw new Error(`Missing table in stats: ${t}`)
    }
  }))

  results.push(runTest('test_backup_creates_meta_file', () => {
    const result = createBackup('test-meta')
    if (!result.success || !result.path) throw new Error('createBackup failed')
    const metaPath = result.path.replace('.db', '.meta.json')
    if (!existsSync(metaPath)) throw new Error('Meta file not created')
  }))

  results.push(runTest('test_backup_meta_contains_version', () => {
    const result = createBackup('test-version')
    if (!result.success || !result.path) throw new Error('createBackup failed')
    const metaPath = result.path.replace('.db', '.meta.json')
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    if (!meta.appVersion) throw new Error('Meta missing appVersion')
    if (meta.appVersion !== app.getVersion()) throw new Error(`Version mismatch: ${meta.appVersion} vs ${app.getVersion()}`)
    if (!meta.tables || typeof meta.tables !== 'object') throw new Error('Meta missing tables')
  }))

  results.push(runTest('test_backup_meta_contains_tables', () => {
    const result = createBackup('test-tables')
    if (!result.success || !result.path) throw new Error('createBackup failed')
    const metaPath = result.path.replace('.db', '.meta.json')
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    if (!meta.tables || Object.keys(meta.tables).length === 0) throw new Error('Tables stats empty')
    const count = Object.values(meta.tables).reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0)
    if (count < 0) throw new Error('Invalid table counts')
  }))

  results.push(runTest('test_check_backup_version', () => {
    const result = createBackup('test-check-version')
    if (!result.success || !result.path) throw new Error('createBackup failed')
    const versionInfo = checkBackupVersion(result.path)
    if (!versionInfo.compatible) throw new Error('Backup should be compatible')
    if (versionInfo.backupVersion !== app.getVersion()) throw new Error(`Version mismatch: ${versionInfo.backupVersion}`)
    if (!versionInfo.meta) throw new Error('Missing meta in version check')
  }))

  results.push(runTest('test_list_backups_returns_array', () => {
    createBackup('test-list-1')
    createBackup('test-list-2')
    const backups = listBackups()
    if (!Array.isArray(backups)) throw new Error('listBackups did not return array')
    const testBackups = backups.filter(b => b.name.startsWith('test-list'))
    if (testBackups.length < 2) throw new Error(`Expected at least 2 test backups, got ${testBackups.length}`)
  }))

  results.push(runTest('test_verify_backup', () => {
    const result = createBackup('test-verify')
    if (!result.success || !result.path) throw new Error('createBackup failed')
    const verifyResult = verifyBackup(result.path)
    if (!verifyResult.success) throw new Error(`verifyBackup failed: ${verifyResult.error}`)
  }))

  results.push(runTest('test_get_backup_stats', () => {
    const stats = getBackupStats()
    if (typeof stats.totalBackups !== 'number') throw new Error('totalBackups not a number')
    if (typeof stats.totalSize !== 'number') throw new Error('totalSize not a number')
  }))

  results.push(runTest('test_cleanup_backups', () => {
    const cleanupResult = cleanupBackups(1000)
    if (typeof cleanupResult.deleted !== 'number') throw new Error('cleanup deleted count not a number')
  }))

  results.push(runTest('test_get_backup_details', () => {
    const result = createBackup('test-details')
    if (!result.success || !result.path) throw new Error('createBackup failed')
    const details = getBackupDetails(result.path)
    if (!details.success) throw new Error(`getBackupDetails failed: ${details.error}`)
    if (!details.data) throw new Error('getBackupDetails returned no data')
    if (!details.data.meta) throw new Error('getBackupDetails missing meta')
    if (!details.data.tables || Object.keys(details.data.tables).length === 0) throw new Error('getBackupDetails missing tables')
    if (!details.data.integrity) throw new Error('getBackupDetails missing integrity')
  }))

  cleanTestBackups()
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
