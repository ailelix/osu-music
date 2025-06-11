// src-electron/electron-preload.ts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'; // 导入 IpcRendererEvent

contextBridge.exposeInMainWorld('electron', {
  process: {
    platform: process.platform,
  },
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      ipcRenderer.on(channel, listener);
      // 返回一个取消监听的函数是好的实践，但如果 App.vue 中使用 removeAllListeners，这里可以不用返回
      // return () => ipcRenderer.removeListener(channel, listener);
    },
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel), // App.vue 用了这个
  },
  // 新增：暴露一个方法来获取初始全屏状态，并监听全屏事件
  windowControls: {
    isFullScreen: () => ipcRenderer.invoke('get-initial-fullscreen-state'),
    onEnterFullScreen: (listener: () => void) => {
      const handler = () => listener();
      ipcRenderer.on('enter-full-screen', handler);
      return () => ipcRenderer.removeListener('enter-full-screen', handler);
    },
    onLeaveFullScreen: (listener: () => void) => {
      const handler = () => listener();
      ipcRenderer.on('leave-full-screen', handler);
      return () => ipcRenderer.removeListener('leave-full-screen', handler);
    },
    // 新增：自定义红绿灯按钮的窗口控制方法
    closeWindow: () => ipcRenderer.invoke('window:close'),
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  },
  // --- Settings Store IPC ---
  settingsStore: {
    get: async (key: string, defaultValue?: unknown): Promise<unknown> => {
      console.log(
        `[Preload] settingsStore.get called - Key: ${key}, DefaultValue: ${String(defaultValue)}`,
      );
      try {
        const result = await ipcRenderer.invoke('settings:get', key, defaultValue);
        console.log(`[Preload] settingsStore.get received from main:`, result);
        return result;
      } catch (error) {
        console.error(`[Preload] settingsStore.get failed - Key: ${key}, Error:`, error);
        return defaultValue;
      }
    },
    set: (key: string, value: string | null): void => {
      console.log(`[Preload] settingsStore.set called - Key: ${key}, Value: ${value}`);
      ipcRenderer.send('settings:set', key, value);
    },
  },
});
