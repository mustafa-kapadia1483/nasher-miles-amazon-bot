import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import nasherIcon from '../../resources/nasher-icon.png?asset'
import exportAmazonProductDetailsToExcel from '../utils/amazon-scraping/exportAmazonProductDetailsToExcel'
import { asinscopeFetch, clearCachedStore } from '../utils/asinscopeFetch'
import exportAsinEanMapping from '../utils/exportAsinEanMapping'
import {
  scrapeAmazonProductDetails,
  openBrowserLogin
} from '../utils/amazon-scraping/scrapeAmazonProductDetails'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: nasherIcon,
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
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPCs

  let browser = null,
    page = null

  ipcMain.handle('open-browser-login', async (e, configObj) => {
    if (browser == null && page == null) {
      let result = await openBrowserLogin(configObj)
      browser = result.browser
      page = result.page
    }
  })

  /* Calls puppeteer function to scrape data off amazon */
  ipcMain.handle('scrape-amazon-product-details', async (e, configObj) => {
    console.log(configObj)
    const extractedData = await scrapeAmazonProductDetails({ browser, page, ...configObj })
    return extractedData
  })

  /* Calls function to create excel from array of data */
  ipcMain.handle('export-amazon-product-details-to-excel', async (e, productDetailsArray) => {
    const result = await exportAmazonProductDetailsToExcel(productDetailsArray)
    return result
  })

  ipcMain.handle('asin-ean-mapping', async (e, asin) => {
    const result = await asinscopeFetch(asin)
    console.log(result)
    return result
  })

  ipcMain.handle('clear-ean-mapping-store', (e, asin) => {
    clearCachedStore()
  })

  ipcMain.handle('export-asin-ean-mapping', async (e, asinEanMappingArray) => {
    const result = await exportAsinEanMapping(asinEanMappingArray)
    return result
  })

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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
