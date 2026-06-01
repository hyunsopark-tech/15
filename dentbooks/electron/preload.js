const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer → main: open native file picker for a specific report
  pickFile: (reportKey) => ipcRenderer.invoke('pick-file', reportKey),

  // Main → renderer: file was chosen (from menu or pick-file result)
  onReport: (callback) => {
    ipcRenderer.on('od-report', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('od-report');
  },

  // Main → renderer: navigate to a page (from menu shortcuts)
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (_event, page) => callback(page));
    return () => ipcRenderer.removeAllListeners('navigate');
  },

  isElectron: true,
});
