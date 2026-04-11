import { contextBridge, ipcRenderer, shell } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("get-app-version"),
  platform: process.platform,
  openExternal: (url: string): Promise<void> => shell.openExternal(url),
});
