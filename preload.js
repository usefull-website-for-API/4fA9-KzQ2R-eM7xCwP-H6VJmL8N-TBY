const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  close: () => ipcRenderer.invoke("close-window"),
  showDialog: (title, message) => ipcRenderer.invoke("show-dialog", title, message),
  openSettings: () => ipcRenderer.invoke("open-settings"),
  getPreferences: () => ipcRenderer.invoke("get-preferences"),
  savePreferences: (prefs) => ipcRenderer.invoke("save-preferences", prefs),
  triggerF1Menu: () => ipcRenderer.invoke("trigger-f1-menu"),
  resetApplication: () => ipcRenderer.invoke("reset-application"),
  openExternalLink: (url) => ipcRenderer.invoke("open-external-link", url),
  selectService: (config) => ipcRenderer.invoke("select-service", config),
  closeSettings: () => ipcRenderer.invoke("close-settings"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  resetApp: () => ipcRenderer.invoke("reset-application"),
  restartApp: () => ipcRenderer.invoke("restart-app"),
  openExternal: (url) => ipcRenderer.invoke("open-external-link", url),
  selectPluginFile: () => ipcRenderer.invoke("select-plugin-file"),
  getPlugins: () => ipcRenderer.invoke("get-plugins"),
  removePlugin: (pluginPath) => ipcRenderer.invoke("remove-plugin", pluginPath),
})
