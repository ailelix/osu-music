<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from 'src/stores/settingsStore';
import { useAuthStore } from 'src/services/auth';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const router = useRouter();
let unlistenNavigateCallback: (() => void) | undefined;

onMounted(() => {
  settingsStore.initializeSettings(); // 同步初始化内存 settingsStore
  authStore.initAuth().catch((error) => {
    console.error('Failed to initialize authStore:', error);
  }); // 异步初始化 authStore

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
    unlistenNavigateCallback = () => {
      window.electron?.ipcRenderer?.removeAllListeners(
        'navigate-to-oauth-callback-with-code',
      );
      console.log('[App.vue] Removed "navigate-to-oauth-callback-with-code" IPC listener.');
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
