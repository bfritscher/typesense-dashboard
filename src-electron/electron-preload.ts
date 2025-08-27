/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */
import { contextBridge, ipcRenderer } from 'electron';
const apiMethods = [
  'init',
  'getDebug',
  'getCollections',
  'createCollection',
  'getCollection',
  'dropCollection',
  'updateCollection',
  'getAliases',
  'upsertAlias',
  'deleteAlias',
  'getApiKeys',
  'createApiKey',
  'deleteApiKey',
  'getAnalyticsRules',
  'upsertAnalyticsRule',
  'deleteAnalyticsRule',
  'getSearchPresets',
  'upsertSearchPreset',
  'deleteSearchPreset',
  'getStopwords',
  'upsertStopwords',
  'deleteStopwords',
  'getSynonyms',
  'upsertSynonym',
  'deleteSynonym',
  'getOverrides',
  'upsertOverride',
  'deleteOverride',
  'deleteDocumentById',
  'importDocuments',
  'exportDocuments',
  'search',
  'get',
  'post',
  'createSnapshot',
];

const api = {
  importFile: (collectionName: any, action: any) => {
    return ipcRenderer.invoke('importFile', collectionName, action);
  },
  rejectTLS: (value: any) => {
    return ipcRenderer.invoke('rejectTLS', value);
  },
  openExternal: (url: string) => {
    return ipcRenderer.invoke('openExternal', url);
  },
};
apiMethods.forEach((f) => {
  // @ts-expect-error allow any
  api[f] = (...args) => {
    return ipcRenderer.invoke(f, ...args);
  };
});

contextBridge.exposeInMainWorld('electron', api);
