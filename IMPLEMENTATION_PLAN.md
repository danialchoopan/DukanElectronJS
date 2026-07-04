# Implementation Plan: Auto-Migration + Enhanced Backup Dialog

## Feature 1: Auto-Migration on Startup

### Problem
`CREATE TABLE IF NOT EXISTS` never adds missing columns. Users upgrading from older versions hit SQL errors when the app reads/writes columns that dont exist yet.

### Solution
A `migrateSchema()` function runs once per process after `initializeDatabase()`, using `PRAGMA table_info` to detect missing columns and `ALTER TABLE ADD COLUMN` to add them.

---

### File 1: src/main/database/connection.ts

Add `EXPECTED_SCHEMA` registry and `migrateSchema()` before `getDatabase()` (after line 35).

**Schema registry:**
```typescript
interface ColumnSpec { name: string; sqlType: string; dflt: string }
interface TablePatch { columns: ColumnSpec[] }

const EXPECTED_SCHEMA: Record<string, TablePatch> = {
  products: {
    columns: [
      { name: 'subcategory', sqlType: 'TEXT', dflt: "''" },
      { name: 'isSellable', sqlType: 'INTEGER', dflt: '1' },
    ],
  },
  sales: {
    columns: [
      { name: 'saleDate', sqlType: 'TEXT', dflt: "(datetime('now','localtime'))" },
      { name: 'affectsInventory', sqlType: 'INTEGER', dflt: '1' },
    ],
  },
}
```

**Migration function:**
```typescript
export function migrateSchema(database: Database.Database): string[] {
  const applied: string[] = []
  for (const [table, patch] of Object.entries(EXPECTED_SCHEMA)) {
    const rows = database.pragma(`table_info("${table}")`) as { name: string }[]
    const existing = new Set(rows.map(r => r.name))
    for (const col of patch.columns) {
      if (!existing.has(col.name)) {
        database.exec(`ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.sqlType} DEFAULT ${col.dflt}`)
        applied.push(`${table}.${col.name}`)
      }
    }
  }
  if (applied.length > 0) {
    try {
      database.prepare('INSERT INTO audit_log (action, entityType, details) VALUES (?, ?, ?)')
        .run('schema_migration', 'system', JSON.stringify({ migrations: applied }))
    } catch { /* audit_log may not exist on very old DBs */ }
  }
  return applied
}
```

**Modify getDatabase()** - add one line after `initializeDatabase(db)`:
```typescript
initializeDatabase(db)
migrateSchema(db) // <-- ADD THIS LINE
```

**Why safe:** PRAGMA returns [] for nonexistent tables. ALTER ADD COLUMN never touches existing columns. Fresh installs are no-ops. Audit log wrapped in try/catch.

---

### File 2: src/types/index.ts

Add at end of file (after line 310):

```typescript
export interface BackupOptions {
  location: 'local' | 'download'
  format: 'sqlite' | 'json' | 'zip'
  scope: 'all' | 'structure' | 'data' | 'selective'
  selectedTables?: string[]
  label?: string
}

export interface BackupCreateInfo {
  success: boolean
  path?: string
  size?: number
  format?: string
  error?: string
}
```

---

## Feature 2: Enhanced Backup Dialog

### New Dependency

```bash
npm install archiver && npm install -D @types/archiver
```

No other zip library is currently in package.json.

---

### File 3: src/main/database/backup.ts

Add `import archiver from 'archiver'` at top. Add three new functions after line 200.

**Function 1: exportAsJson**

```typescript
export function exportAsJson(options: {
  scope: 'all' | 'structure' | 'data' | 'selective'
  selectedTables?: string[]
}): { success: boolean; data?: any; error?: string } {
  try {
    const database = getDatabase()
    const tableRows = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[]
    let tables = tableRows.map(t => t.name)
    if (options.scope === 'selective' && options.selectedTables?.length) {
      tables = tables.filter(t => options.selectedTables!.includes(t))
    }
    const payload: Record<string, any> = {
      version: app.getVersion(),
      timestamp: new Date().toISOString(),
      scope: options.scope,
      tables: {},
    }
    for (const tbl of tables) {
      if (options.scope === 'structure') {
        payload.tables[tbl] = { columns: database.pragma(`table_info("${tbl}")`), rows: [] }
      } else {
        const rows = database.prepare(`SELECT * FROM "${tbl}"`).all()
        payload.tables[tbl] = { rows, count: rows.length }
      }
    }
    return { success: true, data: payload }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
```

**Function 2: saveBackupToFile**

```typescript
export function saveBackupToFile(
  filePath: string,
  opts: { format: 'sqlite' | 'json'; scope: string; selectedTables?: string[]; label?: string }
): { success: boolean; path?: string; size?: number; error?: string } {
  try {
    ensureBackupDir()
    if (opts.format === 'sqlite') {
      copyFileSync(DB_PATH, filePath)
      if (existsSync(WAL_PATH)) copyFileSync(WAL_PATH, filePath + '-wal')
      if (existsSync(SHM_PATH)) copyFileSync(SHM_PATH, filePath + '-shm')
      const h = fileHash(filePath)
      const sz = statSync(filePath).size
      writeFileSync(filePath + '.meta.json', JSON.stringify({
        name: opts.label || 'manual', hash: h, size: sz,
        timestamp: new Date().toISOString(), appVersion: app.getVersion(),
        format: 'sqlite', scope: opts.scope,
        tables: opts.scope === 'selective' ? opts.selectedTables : undefined,
      }, null, 2))
      return { success: true, path: filePath, size: sz }
    }
    if (opts.format === 'json') {
      const r = exportAsJson({ scope: opts.scope as any, selectedTables: opts.selectedTables })
      if (!r.success) return { success: false, error: r.error }
      writeFileSync(filePath, JSON.stringify(r.data, null, 2))
      return { success: true, path: filePath, size: statSync(filePath).size }
    }
    return { success: false, error: 'Unsupported format' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
```

**Function 3: createZipBackup**

```typescript
export async function createZipBackup(
  filePath: string,
  opts: { scope: string; selectedTables?: string[]; label?: string }
): Promise<{ success: boolean; path?: string; size?: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      ensureBackupDir()
      const output = require('fs').createWriteStream(filePath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      output.on('close', () => resolve({ success: true, path: filePath, size: archive.pointer() }))
      archive.on('error', (err: Error) => resolve({ success: false, error: err.message }))
      archive.pipe(output)
      archive.file(DB_PATH, { name: 'pos.db' })
      if (existsSync(WAL_PATH)) archive.file(WAL_PATH, { name: 'pos.db-wal' })
      if (existsSync(SHM_PATH)) archive.file(SHM_PATH, { name: 'pos.db-shm' })
      const meta = { appVersion: app.getVersion(), timestamp: new Date().toISOString(), scope: opts.scope, tables: opts.scope === 'selective' ? opts.selectedTables : undefined, label: opts.label || 'manual' }
      archive.append(JSON.stringify(meta, null, 2), { name: 'backup-meta.json' })
      const jr = exportAsJson({ scope: opts.scope as any, selectedTables: opts.selectedTables })
      if (jr.success && jr.data) archive.append(JSON.stringify(jr.data, null, 2), { name: 'data.json' })
      archive.finalize()
    } catch (err) {
      resolve({ success: false, error: err instanceof Error ? err.message : String(err) })
    }
  })
}
```

---

### File 4: src/main/ipc/handlers.ts

Add one new IPC channel inside `registerAllHandlers()`, after the existing backup block (around line 398). Must use `ipcMain.handle` directly (not the `handle` wrapper) because the handler is async and shows a dialog:

```typescript
ipcMain.handle('backup:enhancedCreate', async (_event, arg: {
  format: 'sqlite' | 'json' | 'zip'
  scope: 'all' | 'structure' | 'data' | 'selective'
  selectedTables?: string[]
  label?: string
}) => {
  try {
    const filters: Record<string, { name: string; extensions: string[] }[]> = {
      sqlite: [{ name: 'SQLite Database', extensions: ['db'] }],
      json: [{ name: 'JSON File', extensions: ['json'] }],
      zip: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    }
    const defaults: Record<string, string> = {
      sqlite: `hesabdari-${new Date().toISOString().slice(0,10)}.db`,
      json: `hesabdari-${new Date().toISOString().slice(0,10)}.json`,
      zip: `hesabdari-${new Date().toISOString().slice(0,10)}.zip`,
    }
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'ذخیره نسخه پشتیبان',
      defaultPath: defaults[arg.format],
      filters: filters[arg.format],
    })
    if (result.canceled || !result.filePath) return { success: false, error: 'cancelled' }
    if (arg.format === 'zip') {
      return await backupService.createZipBackup(result.filePath, {
        scope: arg.scope, selectedTables: arg.selectedTables, label: arg.label,
      })
    }
    return backupService.saveBackupToFile(result.filePath, {
      format: arg.format, scope: arg.scope, selectedTables: arg.selectedTables, label: arg.label,
    })
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
})
```

---

### File 5: src/preload/index.ts

Add to the `backup` object (inside the `api` const, around line 262, before the closing brace):

```typescript
enhancedCreate: (options: {
  format: 'sqlite' | 'json' | 'zip'
  scope: 'all' | 'structure' | 'data' | 'selective'
  selectedTables?: string[]
  label?: string
}): Promise<IPCResponse<any>> => ipcRenderer.invoke('backup:enhancedCreate', options),

getTableStats: (): Promise<IPCResponse<Record<string, number>>> =>
  ipcRenderer.invoke('backup:tableStats', { path: undefined }),
```

Note: the existing `backup:tableStats` handler at handlers.ts:395 already accepts `{ path?: string }` and uses the live DB when path is undefined. The preload call passes `{ path: undefined }`.

---

### File 6: src/renderer/src/views/settings/BackupSection.tsx

Replace the one-click "create backup" button with a 3-step dialog.

**New state variables** (add after line 25):
```typescript
const [showEnhancedDialog, setShowEnhancedDialog] = useState(false)
const [step, setStep] = useState<1 | 2 | 3>(1)
const [backupFormat, setBackupFormat] = useState<'sqlite' | 'json' | 'zip'>('sqlite')
const [backupScope, setBackupScope] = useState<'all' | 'structure' | 'data' | 'selective'>('all')
const [selectedTableList, setSelectedTableList] = useState<string[]>([])
const [availableTables, setAvailableTables] = useState<Record<string, number>>({})
```

**New handler function:**
```typescript
const handleEnhancedBackup = async () => {
  setLoading(true)
  const r = await window.api.backup.enhancedCreate({
    format: backupFormat,
    scope: backupScope,
    selectedTables: backupScope === 'selective' ? selectedTableList : undefined,
    label: 'manual',
  })
  setLoading(false)
  setShowEnhancedDialog(false)
  setStep(1)
  if (r.success) loadData()
  else if (r.error !== 'cancelled') alert(`خطا: ${r.error}`)
}
```

**Replace the button** at line 96. Change `onClick={handleCreateBackup}` to:
```typescript
onClick={async () => {
  const statsRes = await window.api.backup.getTableStats()
  if (statsRes.success && statsRes.data) setAvailableTables(statsRes.data)
  setStep(1); setShowEnhancedDialog(true)
  setBackupFormat('sqlite'); setBackupScope('all'); setSelectedTableList([])
}}
```

**New Dialog JSX** — add before the `confirmDelete` dialog (before line 118):

**Step 1 (Format selection):** Three radio-style cards for SQLite / JSON / ZIP. SQLite = raw db copy (fastest). JSON = structured text (portable). ZIP = db + meta + json (most complete).

**Step 2 (Scope selection):** Four options: All data, Structure only, Data only, Selective. When Selective is chosen, render a scrollable checkbox list of table names with row counts from `availableTables`.

**Step 3 (Confirmation):** Summary card showing chosen format, scope, estimated tables. "Create backup" button calls `handleEnhancedBackup`.

All three steps render inside a single `<Dialog>` component. The footer shows: Back button (if step > 1), Cancel, and Next/Create button.

**Visual design:** Follow existing Dialog patterns - use `DialogButton` variants (primary/ghost), `isDark` theming via `useSettingsStore`, same border/bg colors as the rest of BackupSection. Step indicator can be simple text like "گام ۱ از ۳".

---

## Verification Steps

### Feature 1 (Auto-Migration)
1. Fresh install: app opens, `migrateSchema` runs, returns `[]` (no-op)
2. Simulate old DB: manually drop columns `subcategory` and `isSellable` from products, `saleDate` and `affectsInventory` from sales. Restart app. Verify columns are added with correct defaults.
3. Check `audit_log` for a `schema_migration` entry after the simulated upgrade.
4. Run existing backup tests: `window.api.backup.runTests()` in console.

### Feature 2 (Enhanced Backup Dialog)
1. Click "پشتیبان جدید" button - dialog opens at step 1.
2. Select each format (SQLite, JSON, ZIP) and verify correct file is saved via dialog.
3. Select "Selective" scope, toggle specific tables, verify only those tables appear in the output.
4. Verify SQLite backup includes `.meta.json` sidecar with version, hash, scope.
5. Verify JSON backup is valid JSON with version field and correct table data.
6. Verify ZIP contains `pos.db`, `backup-meta.json`, and `data.json`.
7. Test cancel at any step - dialog closes cleanly, no file created.
8. Run `npm run typecheck` to verify no type errors.
9. Run `npm run lint` if configured.
