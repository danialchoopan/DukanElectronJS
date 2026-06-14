import { app, BrowserWindow, Menu, globalShortcut } from 'electron'
import { join } from 'path'
import { registerAllHandlers } from './ipc/handlers'
import { getDatabase, closeDatabase } from './database/connection'

let mainWindow: BrowserWindow | null = null

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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

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
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  getDatabase()
  registerAllHandlers()
  createWindow()

  globalShortcut.register('F1', () => {
    mainWindow?.webContents.send('navigate', 'pos')
  })
  globalShortcut.register('F2', () => {
    mainWindow?.webContents.send('navigate', 'inventory')
  })
  globalShortcut.register('F3', () => {
    mainWindow?.webContents.send('navigate', 'dashboard')
  })
  globalShortcut.register('F4', () => {
    mainWindow?.webContents.send('navigate', 'admin')
  })

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
