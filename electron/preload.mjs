import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * 监听事件
   * @param {string} channel 事件名称
   * @param {(event: Electron.IpcRendererEvent, ...args: any[]) => void} callback 事件回调
   */
  on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },
  /**
   * 发送事件
   * @param {string} channel 事件名称
   * @param {any[]} args 事件参数
   */
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
});
