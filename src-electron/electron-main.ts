import { BrowserWindow, app, dialog, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | undefined;

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  });

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL);
  } else {
    await mainWindow.loadFile('index.html');
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});

import { Api } from '../src/shared/api';
const appApi = new Api();

ipcMain.handle('importFile', async (events, collectionName, action) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON/LJSON', extensions: ['json', 'ljson'] }],
  });
  if (filePaths && filePaths.length > 0) {
    let documents = fs.readFileSync(filePaths[0] || '', 'utf8');
    try {
      documents = JSON.parse(documents);
    } catch (e) {
      console.error(e);
      // assume ljson
    }
    return appApi.importDocuments(collectionName, documents, action);
  }
});

// @ts-expect-error any
function certErrorHandler(event, webContents, url, error, certificate, callback) {
  // On certificate error we disable default behaviour (stop loading the page)
  // and we then say "it is all fine - true" to the callback
  event.preventDefault();
  callback(true);
}

let certErrorListenerInstalled = false;

ipcMain.handle('rejectTLS', (event, value) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = value;
  if (value === 0 && !certErrorListenerInstalled) {
    app.on('certificate-error', certErrorHandler);
    certErrorListenerInstalled = true;
  } else if (value === 1 && certErrorListenerInstalled) {
    app.off('certificate-error', certErrorHandler);
    certErrorListenerInstalled = false;
  }
});

Object.getOwnPropertyNames(Api.prototype).forEach((f) => {
  ipcMain.handle(f, (event, ...args) => {
    // @ts-expect-error any
    return appApi[f](...args);
  });
});
