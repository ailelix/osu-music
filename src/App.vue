<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from 'src/stores/settingsStore';
import { useAuthStore } from 'src/services/auth';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const router = useRouter();
let unlistenNavigateCallback: (() => void) | undefined;

onMounted(() => {
  settingsStore.initializeSettings(); // 同步初始化内存 settingsStore
  authStore.initAuth().catch((error) => {
    console.error('Failed to initialize authStore:', error);
  }); // 异步初始化 authStore

  // --- 修正：iOS 状态栏安全区适配 ---
  if (
    typeof Capacitor.isNativePlatform === 'function' &&
    typeof Capacitor.getPlatform === 'function' &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'ios'
  ) {
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setStyle({ style: StatusBarStyle.Dark }).catch(() => {}); // 你可以根据 header 颜色选择 Light/Dark
  }

  if (window.electron?.ipcRenderer) {
    // 新的监听器
    const navigateWithCodeHandler = (_event: unknown, ...args: unknown[]) => {
      const code = args[0];
      console.log(
        `[App.vue] Received "navigate-to-oauth-callback-with-code" from main with code. Navigating...`,
      );
      if (typeof code === 'string' && code.trim() !== '') {
        router.push({ name: 'osuCallback', query: { code: code } }).catch((err) => {
          console.error('[App.vue] Navigation to osuCallback page with code failed:', err);
        });
      } else {
        console.error('[App.vue] Received navigation command but no valid code was provided.');
      }
    };
    window.electron.ipcRenderer.on('navigate-to-oauth-callback-with-code', navigateWithCodeHandler);

    // 新的监听器：收到主进程通知后跳转到 osuCallback 页面（不带 code）
    const pendingCallbackHandler = () => {
      console.log('[App.vue] Received "oauth-callback-pending". Navigating to osuCallback page.');
      router.push({ name: 'osuCallback' }).catch((err) => {
        console.error('[App.vue] Navigation to osuCallback page (pending) failed:', err);
      });
    };
    window.electron.ipcRenderer.on('oauth-callback-pending', pendingCallbackHandler);

    unlistenNavigateCallback = () => {
      window.electron?.ipcRenderer?.removeAllListeners('oauth-callback-pending');
      console.log('[App.vue] Removed "oauth-callback-pending" IPC listener.');
    };
  } else {
    console.warn(
      '[App.vue] Electron IPC not available, cannot listen for OAuth navigation commands.',
    );
  }
});

onUnmounted(() => {
  if (unlistenNavigateCallback) {
    unlistenNavigateCallback();
  }
});
</script>
