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
 */
import { ipcRenderer, contextBridge } from 'electron';
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
];

const api = {
  importFile: (collectionName, action) => {
    return ipcRenderer.invoke('importFile', collectionName, action);
  },
  rejectTLS: (value) => {
    return ipcRenderer.invoke('rejectTLS', value);
  },
};
apiMethods.forEach((f) => {
  api[f] = (...args) => {
    return ipcRenderer.invoke(f, ...args);
  };
});

contextBridge.exposeInMainWorld('electron', api);
