import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import type { Schema } from 'electron-store';
import Store from 'electron-store'; // 导入 electron-store 和 Schema
import axios from 'axios';
import type { AxiosError } from 'axios'; // 新增: 用于主进程 token 交换

// 定义设置项的结构 (与渲染进程的 AppSettings 一致)
interface AppSettings {
  osuClientId: string | null;
  osuClientSecret: string | null;
}

// 定义 electron-store 的 schema
const schema: Schema<AppSettings> = {
  osuClientId: {
    type: ['string', 'null'], // 允许字符串或 null
    default: null,
  },
  osuClientSecret: {
    type: ['string', 'null'], // 允许字符串或 null
    default: null,
  },
};

// 初始化 electron-store 实例
const appSettingsStore = new Store<AppSettings>({ schema, name: 'app-settings' }); // 给 store 起个名字

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

const currentDir = fileURLToPath(new URL('.', import.meta.url));

const PROTOCOL_SCHEME = 'osu-music-fusion'; // 定义你的协议名称

let mainWindow: BrowserWindow | undefined;

// 确保应用是单例
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', (_, commandLine) => {
    console.log('[Main Process] second-instance triggered with commandLine:', commandLine);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const url = commandLine.pop()?.replace(/\/$/, ''); // 获取最后一个参数，通常是 URL
      console.log('[Main Process] Extracted URL from commandLine:', url);
      if (url && url.startsWith(`${PROTOCOL_SCHEME}://`)) {
        handleProtocolUrl(url);
      }
    }
  });
}

// 注册自定义协议
app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);

// 处理通过自定义协议打开应用的 URL
let pendingAuthCode: string | null = null; // 用于暂存 code

function handleProtocolUrl(url: string) {
  console.log('[Main Process] handleProtocolUrl called with URL:', url);
  try {
    const parsedUrl = new URL(url);
    console.log('[Main Process] Parsed URL Object:', parsedUrl); // 打印整个 URL 对象
    console.log('[Main Process] URL Search Params:', parsedUrl.search); // 打印 ?foo=bar&baz=qux
    console.log('[Main Process] URL SearchParams toString():', parsedUrl.searchParams.toString()); // 打印 foo=bar&baz=qux
    const authCode = parsedUrl.searchParams.get('code');
    const errorParam = parsedUrl.searchParams.get('error'); // 检查是否有 error 参数
    const errorDescriptionParam = parsedUrl.searchParams.get('error_description'); // 检查错误描述
    console.log('[Main Process] Extracted authCode:', authCode);
    if (errorParam) {
      console.error('[Main Process] OAuth Error from Osu!:', errorParam);
      if (errorDescriptionParam) {
        console.error('[Main Process] OAuth Error Description:', errorDescriptionParam);
      }
      // 通过 IPC 将错误信息传递给渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('oauth-error-received', {
          error: errorParam,
          description: errorDescriptionParam,
        });
      }
      return; // 如果有错误，就不再尝试发送 code
    }
    if (authCode && mainWindow) {
      pendingAuthCode = authCode; // 暂存 code
      console.log('[Main Process] Auth code received and stashed:', pendingAuthCode);
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('oauth-callback-pending'); // 只通知，不带 code
      console.log("[Main Process] Sent 'oauth-callback-pending' to renderer.");
    } else {
      console.error(
        '[Main Process] Could not extract code from protocol URL or mainWindow not available.',
      );
    }
  } catch (e) {
    console.error('[Main Process] Error parsing protocol URL or sending IPC:', e);
  }
}

// 新增: 渲染进程主动拉取 code
ipcMain.handle('get-pending-oauth-code', () => {
  if (pendingAuthCode) {
    const codeToReturn = pendingAuthCode;
    pendingAuthCode = null; // 获取后清除
    console.log('[Main Process] Renderer requested pending auth code, returning:', codeToReturn);
    return { success: true, code: codeToReturn };
  } else {
    console.warn('[Main Process] Renderer requested pending auth code, but none was found.');
    return { success: false, error: 'No pending auth code' };
  }
});

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1200,
    height: 800,
    useContentSize: true,
    frame: false, // 创建无边框窗口
    titleBarStyle: platform === 'darwin' ? 'hiddenInset' : 'hidden', // macOS 特殊处理
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

void app.whenReady().then(() => {
  void createWindow();

  // 处理 macOS 上的 open-url 事件
  app.on('open-url', (event, url) => {
    console.log('[Main Process] open-url triggered with URL:', url);
    event.preventDefault();
    if (mainWindow) {
      handleProtocolUrl(url);
    } else {
      console.warn('[Main Process] Received open-url before mainWindow was ready. URL:', url);
    }
  });

  // --- IPC Handlers for Settings Store ---
  ipcMain.handle('settings:get', (event, key: keyof AppSettings, defaultValue?: unknown) => {
    console.log(
      `[Main IPC] settings:get received - Key: ${String(key)}, DefaultValue: ${String(defaultValue)}`,
    );
    try {
      const value = appSettingsStore.get(key, defaultValue as string | null);
      console.log(`[Main IPC] settings:get returning - Value: ${String(value)}`);
      return value;
    } catch (error) {
      console.error(`[Main IPC] settings:get failed - Key: ${key}, Error:`, error);
      return defaultValue;
    }
  });

  ipcMain.on('settings:set', (event, key: keyof AppSettings, value: string | null) => {
    console.log(`[Main IPC] settings:set received - Key: ${key}, Value: ${value}`);
    try {
      appSettingsStore.set(key, value);
      console.log(
        `[Main IPC] settings:set - ${key} successfully set to "${value}" in electron-store. File should be at: ${appSettingsStore.path}`,
      );
    } catch (error) {
      console.error(`[Main IPC] settings:set - Error setting ${key} in electron-store:`, error);
    }
  });

  // 可选：为其他 electron-store 方法创建 handlers (delete, clear, etc.)
  // ipcMain.on('settings:delete', (event, key: keyof AppSettings) => {
  //   appSettingsStore.delete(key);
  // });

  // IPC handler for opening external URLs
  ipcMain.on('open-external-url', (event, urlToOpen) => {
    shell
      .openExternal(urlToOpen)
      .catch((err) => console.error('Failed to open external URL:', err));
  });

  // 处理获取初始全屏状态的请求
  ipcMain.handle('get-initial-fullscreen-state', () => {
    return mainWindow?.isFullScreen() || false;
  });

  ipcMain.handle('get-initial-maximize-state', () => {
    return mainWindow?.isMaximized() || false;
  });

  // 监听窗口事件并通知渲染进程
  mainWindow?.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized');
  });
  mainWindow?.on('unmaximize', () => {
    mainWindow?.webContents.send('window-unmaximized');
  });
  mainWindow?.on('enter-full-screen', () => {
    mainWindow?.webContents.send('enter-full-screen');
  });
  mainWindow?.on('leave-full-screen', () => {
    mainWindow?.webContents.send('leave-full-screen');
  });

  // IPC handlers for window controls
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
  });
  ipcMain.on('toggle-maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('close-window', () => {
    mainWindow?.close();
  });

  // --- 新增: 处理 Osu! token 交换 ---
  ipcMain.handle('exchange-osu-token', async (event, { code, clientId, clientSecret }) => {
    try {
      const payload = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'osu-music-fusion://oauth/callback',
      });
      const response = await axios.post('https://osu.ppy.sh/oauth/token', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError?.(error)) {
        return { error: true, message: error.response?.data || error.message };
      }
      return { error: true, message: String(error) };
    }
  });

  // --- 新增: 代理获取 Osu! 用户信息 ---
  ipcMain.handle('fetch-osu-user-profile', async (event, accessToken: string | null) => {
    console.log('[Main Process] Received fetch-osu-user-profile request.');
    if (!accessToken) {
      console.error('[Main Process] No access token provided for fetching user profile.');
      return { success: false, error: 'Access token is missing', status: 401 };
    }
    const OSU_API_ME_URL = 'https://osu.ppy.sh/api/v2/me';
    try {
      const response = await axios.get(OSU_API_ME_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      console.log('[Main Process] User profile fetched successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error fetching profile';
      let errorStatus: number | undefined = undefined;
      let errorData: unknown = undefined;

      if (typeof error === 'object' && error !== null) {
        const err = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };
        errorData = err.response?.data;
        errorMessage = err.response?.data?.message || err.message || errorMessage;
        errorStatus = err.response?.status;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error(
        '[Main Process] Error fetching Osu! user profile in main process:',
        errorData || errorMessage,
      );
      return {
        success: false,
        error: errorMessage,
        status: errorStatus,
      };
    }
  });

  // 新增 IPC 处理器，用于从外部 URL 获取音频数据并返回 Data URL
  ipcMain.handle('fetch-audio-data', async (event, url) => {
    // 确保 URL 包含协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }

    console.log(`[Main Process] Attempting to fetch audio from: ${url}`);
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000, // 设置超时为15秒
      });
      console.log(`[Main Process] Axios GET request to ${url} status: ${response.status}`);
      const base64Audio = Buffer.from(response.data).toString('base64');
      return `data:audio/mpeg;base64,${base64Audio}`;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`[Main Process] AXIOS ERROR fetching audio from ${url}:`);
      if (axiosError.response) {
        console.error('[Main Process] Error Response Data:', axiosError.response.data);
        console.error('[Main Process] Error Response Status:', axiosError.response.status);
        console.error('[Main Process] Error Response Headers:', axiosError.response.headers);
      } else if (axiosError.request) {
        console.error('[Main Process] Error Request Data:', axiosError.request);
      } else {
        console.error('[Main Process] Error Message:', axiosError.message);
      }
      console.error('[Main Process] Error Config:', axiosError.config);
      throw new Error(`Failed to fetch audio data from main: ${axiosError.message}`);
    }
  });
});

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
