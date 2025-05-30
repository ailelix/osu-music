// src/stores/auth.ts
import { defineStore } from 'pinia';
import { refreshToken as refreshOsuTokenService } from 'src/services/osuAuthService'; // 导入刷新服务
import { Capacitor } from '@capacitor/core';
import type { HttpResponse } from '@capacitor/http';
import { Http } from '@capacitor/http';

// 定义用户信息的接口
export interface OsuUserProfile {
  id: number;
  username: string;
  avatar_url: string;
  country_code: string;
  is_supporter: boolean;
  // ... 根据 Osu! API /me 端点返回的数据添加更多字段
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: OsuUserProfile | null;
  isLoading: boolean;
  pendingOAuthCode: string | null; // 新增临时存储 code
}

// 定义 IPC 返回结果类型

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: localStorage.getItem('osu_access_token') || null,
    refreshToken: localStorage.getItem('osu_refresh_token') || null,
    expiresAt: parseInt(localStorage.getItem('osu_expires_at') || '0', 10) || null,
    user: JSON.parse(localStorage.getItem('osu_user_profile') || 'null'),
    isLoading: false,
    pendingOAuthCode: null, // 新增
  }),

  getters: {
    isAuthenticated: (state): boolean => {
      return !!state.accessToken && (state.expiresAt ? Date.now() < state.expiresAt : false);
    },
    currentUser: (state) => state.user,
  },

  actions: {
    setTokens(accessToken: string, refreshToken: string | null, expiresIn: number) {
      this.accessToken = accessToken;
      this.expiresAt = Date.now() + (expiresIn - 300) * 1000; // 提前 5 分钟视为过期，以便刷新

      if (refreshToken) {
        // Osu! 可能在每次刷新时不一定返回新的 refresh token
        this.refreshToken = refreshToken;
        localStorage.setItem('osu_refresh_token', refreshToken);
      }

      localStorage.setItem('osu_access_token', accessToken);
      localStorage.setItem('osu_expires_at', this.expiresAt.toString());

      // 在设置 token 后立即获取用户信息
      void this.fetchUserProfile();
    },
    setPendingOAuthCode(code: string | null) {
      this.pendingOAuthCode = code;
      if (code) {
        console.log('[AuthStore] Pending OAuth Code SET:', code);
      } else {
        console.log('[AuthStore] Pending OAuth Code CLEARED.');
      }
    },
    consumePendingOAuthCode(): string | null {
      const code = this.pendingOAuthCode;
      this.pendingOAuthCode = null;
      if (code) {
        console.log('[AuthStore] Pending OAuth Code CONSUMED:', code);
      }
      return code;
    },

    async fetchUserProfile() {
      if (!this.accessToken) {
        console.warn('[AuthStore] Cannot fetch user profile without an access token.');
        throw new Error('No access token available for fetching user profile.');
      }
      const OSU_API_ME_URL = 'https://osu.ppy.sh/api/v2/me';
      this.isLoading = true;
      try {
        if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
          // === CAPACITOR iOS/Android using @capacitor/http ===
          console.log(
            '[AuthStore Capacitor] Attempting to fetch user profile via @capacitor/http with token:',
            this.accessToken,
          );
          const options = {
            url: OSU_API_ME_URL,
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              Accept: 'application/json',
            },
          };
          const response: HttpResponse = await Http.request(options);
          console.log('[AuthStore Capacitor] User profile response status:', response.status);
          console.log('[AuthStore Capacitor] User profile response data:', response.data);
          if (response.status >= 200 && response.status < 300 && response.data) {
            this.user = response.data as OsuUserProfile;
            localStorage.setItem('osu_user_profile', JSON.stringify(this.user));
          } else {
            console.error(
              '[AuthStore Capacitor] Failed to fetch user profile. Status:',
              response.status,
            );
            if (response.status === 401) {
              const refreshed = await this.tryRefreshToken();
              if (refreshed) {
                await this.fetchUserProfile();
                if (!this.user)
                  throw new Error('Failed to fetch profile after refresh (Capacitor)');
              } else {
                this.logout();
                throw new Error('Token refresh failed (Capacitor).');
              }
            } else {
              throw new Error(
                response.data?.message || `Failed to fetch profile. Status: ${response.status}`,
              );
            }
          }
        } else if (window.electron?.ipcRenderer) {
          // === ELECTRON ===
          const result = await window.electron.ipcRenderer.invoke(
            'fetch-osu-user-profile',
            this.accessToken,
          );
          const r = result as {
            success?: boolean;
            data?: OsuUserProfile;
            status?: number;
            error?: string;
          };
          if (r && r.success && r.data) {
            this.user = r.data;
            localStorage.setItem('osu_user_profile', JSON.stringify(this.user));
          } else {
            if (r && r.status === 401) {
              const refreshed = await this.tryRefreshToken();
              if (refreshed) {
                const newResult = await window.electron?.ipcRenderer?.invoke(
                  'fetch-osu-user-profile',
                  this.accessToken,
                );
                const nr = newResult as {
                  success?: boolean;
                  data?: OsuUserProfile;
                  status?: number;
                  error?: string;
                };
                if (nr && nr.success && nr.data) {
                  this.user = nr.data;
                  localStorage.setItem('osu_user_profile', JSON.stringify(this.user));
                } else {
                  throw new Error(nr?.error || 'Failed to fetch profile after refresh');
                }
              } else {
                this.logout();
                throw new Error('Token refresh failed.');
              }
            } else {
              throw new Error(r?.error || 'Failed to fetch user profile.');
            }
          }
        } else {
          throw new Error('Platform not supported for fetching user profile.');
        }
      } catch (error) {
        console.error('[AuthStore] Error fetching user profile:', error);
        this.isLoading = false;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async tryRefreshToken(): Promise<boolean> {
      if (!this.refreshToken) {
        console.warn('No refresh token available to try refresh.');
        this.logout(); // 没有 refresh token，直接登出
        return false;
      }
      this.isLoading = true;
      try {
        // 调用 osuAuthService 中的刷新逻辑
        return await refreshOsuTokenService();
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      this.user = null;
      localStorage.removeItem('osu_access_token');
      localStorage.removeItem('osu_refresh_token');
      localStorage.removeItem('osu_expires_at');
      localStorage.removeItem('osu_user_profile');
      sessionStorage.removeItem('osu_code_verifier'); // 也清除这个
      // 可以在这里添加 router.push('/') 或类似操作
      console.log('User logged out from Osu! store.');
    },

    // 初始化 store，例如在应用启动时调用
    // 检查 token 是否仍然有效，如果无效或即将过期，尝试刷新
    async initAuth() {
      if (this.accessToken && this.expiresAt && Date.now() >= this.expiresAt) {
        console.log('Access token expired, attempting refresh on init.');
        await this.tryRefreshToken();
      }
      // 如果有 token 但没有 user 信息，尝试获取
      if (this.isAuthenticated && !this.user) {
        await this.fetchUserProfile();
      }
    },
  },
});
