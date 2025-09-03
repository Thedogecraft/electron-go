import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 690,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// go logic
const { spawn } = require('child_process')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL

const goBinary = isDev
  ? path.join(__dirname, '../../go/main.exe') 
  : path.join(process.resourcesPath, 'app.asar.unpacked', 'go', 'main.exe')

let goProc = null

function startGoProcess() {
  console.log('[GO]: Starting Go process...')
  goProc = spawn(goBinary, [], { stdio: ['pipe', 'pipe', 'pipe'] })

  goProc.stderr.on('data', (data) => {
    console.log(`[GO]: ${data.toString()}`)
  })

  goProc.on('error', (err) => {
    console.error('[GO]: Failed to start Go process:', err)
  })

  goProc.on('exit', (code, signal) => {
    console.log(`[GO]: Go process exited with code ${code} and signal ${signal}`)
    setTimeout(startGoProcess, 500)
  })
}

startGoProcess()
