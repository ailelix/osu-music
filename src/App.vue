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
    const navigateHandler = () => {
      console.log(
        '[App.vue] Received "navigate-to-oauth-callback" from main. Navigating to OsuCallbackPage...',
      );
      router.push({ name: 'osuCallback' }).catch((err) => {
        console.error('[App.vue] Navigation to osuCallback page failed:', err);
      });
    };
    window.electron.ipcRenderer.on('navigate-to-oauth-callback', navigateHandler);
    unlistenNavigateCallback = () => {
      window.electron?.ipcRenderer?.removeAllListeners('navigate-to-oauth-callback');
      console.log('[App.vue] Removed "navigate-to-oauth-callback" IPC listener.');
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
