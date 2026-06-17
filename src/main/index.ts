import { app, BrowserWindow, Menu, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { registerAllHandlers } from './ipc/handlers'
import { getDatabase, closeDatabase } from './database/connection'
import { seedDatabase } from './database/seed'
import { readFileSync } from 'fs'
import { appendFileSync } from 'fs'

let mainWindow: BrowserWindow | null = null

function getLogPath(): string {
  const logDir = app.getPath('userData')
  return join(logDir, 'pos-error.log')
}

function logError(message: string, stack?: string): void {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}${stack ? '\nStack: ' + stack : ''}\n\n`
  try {
    const logPath = getLogPath()
    appendFileSync(logPath, logEntry, 'utf-8')
  } catch (e) { /* ignore */ }
  console.error(`[POS ERROR] ${message}`, stack || '')
}

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`, error.stack)
  if (mainWindow) {
    dialog.showErrorBox('Application Error', `An error occurred:\n\n${error.message}\n\nCheck the log file for details:\n${getLogPath()}`)
  }
})

process.on('unhandledRejection', (reason: any) => {
  logError(`Unhandled Rejection: ${reason?.message || reason}`, reason?.stack)
})

app.whenReady().then(() => {
  getDatabase()
  seedDatabase()
  registerAllHandlers()
  createWindow()

  globalShortcut.register('F1', () => { mainWindow?.webContents.send('navigate', 'pos') })
  globalShortcut.register('F2', () => { mainWindow?.webContents.send('navigate', 'inventory') })
  globalShortcut.register('F3', () => { mainWindow?.webContents.send('navigate', 'dashboard') })
  globalShortcut.register('F4', () => { mainWindow?.webContents.send('navigate', 'admin') })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeDatabase()
})

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'POS',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    backgroundColor: '#0f172a',
    show: false,
  })

  mainWindow.on('ready-to-show', () => { mainWindow?.show() })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logError(`Page load failed: ${errorCode} - ${errorDescription}`)
    dialog.showErrorBox('Load Error', `Failed to load page:\n${errorDescription}\n\nError Code: ${errorCode}`)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logError(`Renderer process crashed: ${details.reason}`)
    dialog.showErrorBox('App Crashed', `The renderer process has crashed.\nReason: ${details.reason}`)
  })

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) {
      logError(`Console Error: ${message}`)
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  buildMenu()
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Full Screen', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Dev Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'View Error Log', click: () => {
          try { const log = readFileSync(getLogPath(), 'utf-8'); dialog.showMessageBox(mainWindow!, { type: 'info', title: 'Error Log', message: log || 'No errors logged.' }) }
          catch { dialog.showMessageBox(mainWindow!, { type: 'info', title: 'Error Log', message: 'No errors logged.' }) }
        }},
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
