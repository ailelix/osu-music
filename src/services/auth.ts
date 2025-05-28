// src/stores/auth.ts
import { defineStore } from 'pinia';
import { api as osuApi } from 'boot/axios'; // 你的 Axios 实例 (用于调用 Osu! API)
import { refreshToken as refreshOsuTokenService } from 'src/services/osuAuthService'; // 导入刷新服务

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
  expiresAt: number | null; // Token 过期的时间戳 (毫秒)
  user: OsuUserProfile | null;
  isLoading: boolean; // 用于跟踪认证或用户信息获取过程
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: localStorage.getItem('osu_access_token') || null,
    refreshToken: localStorage.getItem('osu_refresh_token') || null,
    expiresAt: parseInt(localStorage.getItem('osu_expires_at') || '0', 10) || null,
    user: JSON.parse(localStorage.getItem('osu_user_profile') || 'null'),
    isLoading: false,
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

      if (refreshToken) { // Osu! 可能在每次刷新时不一定返回新的 refresh token
        this.refreshToken = refreshToken;
        localStorage.setItem('osu_refresh_token', refreshToken);
      }

      localStorage.setItem('osu_access_token', accessToken);
      localStorage.setItem('osu_expires_at', this.expiresAt.toString());

      // 在设置 token 后立即获取用户信息
      void this.fetchUserProfile();
    },

    async fetchUserProfile() {
      if (!this.accessToken) {
        console.warn('Cannot fetch user profile without an access token.');
        return;
      }
      this.isLoading = true;
      try {
        // 使用配置好的 axios 实例 (osuApi) 来调用 Osu! API
        const response = await osuApi.get<OsuUserProfile>('/me');
        this.user = response.data;
        localStorage.setItem('osu_user_profile', JSON.stringify(this.user));
      } catch (error: unknown) {
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { status?: number; data?: unknown } };
          console.error('Failed to fetch Osu! user profile:', axiosError.response?.data || error.message);
          // 如果获取用户信息时 token 失效 (例如401)，尝试刷新
          if (axiosError.response?.status === 401) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              await this.fetchUserProfile(); // 刷新成功后重试
            } else {
              this.logout(); // 刷新失败则登出
            }
          }
        } else {
          console.error('An unknown error occurred:', error);
        }
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
    }
  },
});
