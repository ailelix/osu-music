/// <reference types="vite/client" />

import type { IpcRendererEvent } from 'electron';
// src/env.d.ts

interface AppSettings {
  osuClientId: string | null;
  osuClientSecret: string | null;
}

interface ElectronSettingsStoreApi {
  get: <K extends keyof AppSettings>(
    key: K,
    defaultValue?: AppSettings[K],
  ) => Promise<AppSettings[K] | undefined>;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

interface ElectronWindowControlsApi {
  isFullScreen: () => Promise<boolean>;
  onEnterFullScreen: (listener: () => void) => () => void;
  onLeaveFullScreen: (listener: () => void) => () => void;
}

interface ElectronApi {
  process?: { platform?: string };
  ipcRenderer?: {
    send: (channel: string, ...args: unknown[]) => void;
    invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
    // 直接使用 IpcRendererEvent
    on: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: unknown[]) => void,
    ) => () => void;
    removeAllListeners: (channel: string) => void;
  };
  windowControls?: ElectronWindowControlsApi;
  settingsStore?: ElectronSettingsStoreApi; // 启用并定义类型
}

declare global {
  interface Window {
    electron?: ElectronApi;
  }
}

export {};
