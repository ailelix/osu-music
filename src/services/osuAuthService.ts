// src/services/osuAuthService.ts
import { useAuthStore } from './auth'; // 稍后会创建这个 store
import { useSettingsStore } from 'stores/settingsStore'; // <--- 导入 settings store
import { Capacitor } from '@capacitor/core';
import type { HttpResponse } from '@capacitor/http';
import { Http } from '@capacitor/http';

// --- 配置常量 ---
// !!! 警告: 在开源项目中，将 CLIENT_ID 直接硬编码在前端是不安全的最佳实践 !!!
// 对于开源桌面/移动应用，这有时是可接受的，但Web应用通常应通过后端代理。
// 考虑到目标是开源且优先考虑开发速度，我们暂时这样做。
// 你需要在 Osu! 开发者门户注册你的应用并获取 Client ID。

// 这个 REDIRECT_URI 必须与你在 Osu! 应用设置中配置的完全一致
// 对于本地开发 (quasar dev)，它通常是 Vite 的服务地址 + 你定义的回调路径
// 对于 Electron，它会是一个自定义协议，例如 'osu-music-fusion://oauth/callback'
const OSU_REDIRECT_URI: string = 'osu-music-fusion://oauth/callback'; // <--- 使用自定义协议

const OSU_AUTHORIZE_URL = 'https://osu.ppy.sh/oauth/authorize';
const OSU_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';

// 定义 Token 响应的接口
interface OsuTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  // 可能还有其他字段
}

/**
 * 生成 PKCE code verifier 和 challenge, 并将用户重定向到 Osu! 授权页面。
 */
export function redirectToOsuLogin(): Promise<void> {
  const settingsStore = useSettingsStore(); // <--- 获取 settings store 实例
  const clientId = settingsStore.osuClientId; // <--- 从 store 读取 Client ID
  if (typeof clientId !== 'string' || !clientId.trim()) {
    // <--- 添加类型检查和 trim
    console.error('Osu! Client ID is not configured in application settings.');
    alert('Please configure your Osu! Client ID in the Settings page.');
    return Promise.resolve();
  }

  const params = new URLSearchParams({
    client_id: clientId, // <--- 使用从 store 获取的 clientId
    redirect_uri: OSU_REDIRECT_URI, // 现在是自定义协议
    response_type: 'code',
    scope: 'identify public friends.read chat.read', // <--- 修改 scope 参数
  });

  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.send(
      'open-external-url',
      `${OSU_AUTHORIZE_URL}?${params.toString()}`,
    );
  } else {
    console.warn(
      'Electron IPC not available for opening external URL. Attempting window.location.href.',
    );
    window.location.href = `${OSU_AUTHORIZE_URL}?${params.toString()}`;
  }

  return Promise.resolve();
}

/**
 * 在 Osu! 回调后，使用授权码 (code) 和 code_verifier 获取 Access Token。
 * @param code - 从 Osu! 回调 URL 中获取的授权码。
 * @returns Promise<boolean> - 指示 token 获取是否成功。
 */
export async function handleOsuCallback(code: string): Promise<boolean> {
  const settingsStore = useSettingsStore();
  const clientId = settingsStore.osuClientId;
  const clientSecret = settingsStore.osuClientSecret;
  if (!clientId || !clientSecret) {
    console.error(
      'Osu! Client ID or Client Secret not configured (in memory settings) for token exchange.',
    );
    alert('Please configure your Osu! Client ID and Client Secret in the Settings page.');
    return false;
  }
  const payload = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: OSU_REDIRECT_URI,
  });
  // --- Capacitor 原生环境 ---
  if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    try {
      const options = {
        url: OSU_TOKEN_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        data: payload.toString(),
      };
      console.log(
        '[osuAuthService Capacitor] Attempting token exchange via @capacitor/http...',
        options,
      );
      const response: HttpResponse = await Http.request(options);
      console.log('[osuAuthService Capacitor] Token exchange response:', response);
      if (response.status >= 200 && response.status < 300 && response.data) {
        const tokenResponse = response.data as OsuTokenResponse;
        if (tokenResponse && tokenResponse.access_token) {
          const authStore = useAuthStore();
          authStore.setTokens(
            tokenResponse.access_token,
            tokenResponse.refresh_token,
            tokenResponse.expires_in,
          );
          return true;
        }
      }
      const authStore = useAuthStore();
      authStore.logout();
      return false;
    } catch (error) {
      console.error(
        '[osuAuthService Capacitor] Error during @capacitor/http token exchange:',
        error,
      );
      const authStore = useAuthStore();
      authStore.logout();
      return false;
    }
  }
  // --- Electron 环境 ---
  if (window.electron?.ipcRenderer) {
    const tokenResponse = await window.electron.ipcRenderer.invoke('exchange-osu-token', {
      code,
      clientId,
      clientSecret,
    });
    // 类型保护，确保 tokenResponse 结构正确
    if (
      tokenResponse &&
      typeof tokenResponse === 'object' &&
      'access_token' in tokenResponse &&
      'refresh_token' in tokenResponse &&
      'expires_in' in tokenResponse
    ) {
      const authStore = useAuthStore();
      authStore.setTokens(
        (tokenResponse as OsuTokenResponse).access_token,
        (tokenResponse as OsuTokenResponse).refresh_token,
        (tokenResponse as OsuTokenResponse).expires_in,
      );
      return true;
    } else {
      // 主进程返回了错误
      const authStore = useAuthStore();
      authStore.logout();
      return false;
    }
  } else {
    // --- Web 环境降级 ---
    try {
      const response = await fetch(OSU_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: payload.toString(),
      });
      if (response.ok) {
        const tokenResponse = (await response.json()) as OsuTokenResponse;
        if (tokenResponse && tokenResponse.access_token) {
          const authStore = useAuthStore();
          authStore.setTokens(
            tokenResponse.access_token,
            tokenResponse.refresh_token,
            tokenResponse.expires_in,
          );
          return true;
        }
      }
      const authStore = useAuthStore();
      authStore.logout();
      return false;
    } catch {
      const authStore = useAuthStore();
      authStore.logout();
      return false;
    }
  }
}

/**
 * 使用 Refresh Token 获取新的 Access Token。
 * @returns Promise<boolean> - 指示 token 刷新是否成功。
 */
export async function refreshToken(): Promise<boolean> {
  const settingsStore = useSettingsStore();
  const clientId = settingsStore.osuClientId;
  const clientSecret = settingsStore.osuClientSecret;
  const authStore = useAuthStore();
  if (!authStore.refreshToken) {
    console.warn('No Osu! refresh token available for refresh.');
    authStore.logout();
    return false;
  }
  if (!clientId || !clientSecret) {
    console.error('Osu! API credentials not configured for token refresh.');
    authStore.logout();
    return false;
  }
  const payload = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: authStore.refreshToken,
    scope: 'identify public friends.read chat.read',
  });
  // --- Capacitor 原生环境 ---
  if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    try {
      const options = {
        url: OSU_TOKEN_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        data: payload.toString(),
      };
      const response: HttpResponse = await Http.request(options);
      if (response.status >= 200 && response.status < 300 && response.data) {
        const tokenData = response.data as OsuTokenResponse;
        if (tokenData && tokenData.access_token) {
          authStore.setTokens(
            tokenData.access_token,
            tokenData.refresh_token,
            tokenData.expires_in,
          );
          return true;
        }
      }
      if (response.status === 400 || response.status === 401) {
        authStore.logout();
      }
      return false;
    } catch {
      authStore.logout();
      return false;
    }
  }
  // --- Electron 环境 ---
  if (window.electron?.ipcRenderer) {
    try {
      const result = await window.electron.ipcRenderer.invoke('refresh-osu-token', {
        refreshToken: authStore.refreshToken,
        clientId,
        clientSecret,
        scope: 'identify public friends.read chat.read',
      });
      // 类型断言，确保 r.data 为 OsuTokenResponse 类型
      const r = result as { success?: boolean; data?: unknown; error?: unknown; status?: number };
      if (r && r.success && r.data && typeof r.data === 'object' && r.data !== null) {
        const tokenData = r.data as OsuTokenResponse;
        authStore.setTokens(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in);
        return true;
      } else {
        console.error('Error refreshing Osu! token (IPC):', r?.error || r);
        if (r?.status === 400 || r?.status === 401) {
          authStore.logout();
        }
        return false;
      }
    } catch (error) {
      console.error('Unknown error refreshing Osu! token (IPC):', error);
      return false;
    }
  } else {
    // --- Web 环境降级 ---
    try {
      const response = await fetch(OSU_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: payload.toString(),
      });
      if (response.ok) {
        const tokenData = (await response.json()) as OsuTokenResponse;
        if (tokenData && tokenData.access_token) {
          authStore.setTokens(
            tokenData.access_token,
            tokenData.refresh_token,
            tokenData.expires_in,
          );
          return true;
        }
      }
      if (response.status === 400 || response.status === 401) {
        authStore.logout();
      }
      return false;
    } catch {
      authStore.logout();
      return false;
    }
  }
}
