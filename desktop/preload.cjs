const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  config: ipcRenderer.sendSync('desktop:config'),
  store: (action, key, value) => ipcRenderer.invoke('desktop:store', action, key, value),
  request: (url, options) => ipcRenderer.invoke('desktop:request', url, options),
  dialog: (title, message, buttons) => ipcRenderer.invoke('desktop:dialog', title, message, buttons),
});
