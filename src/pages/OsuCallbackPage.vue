<template>
  <q-page class="flex flex-center column text-center q-pa-md">
    <q-spinner-gears :color="spinnerColor" size="3rem" class="q-mb-lg" />
    <div class="text-h6 q-mb-sm">{{ statusMessage }}</div>
    <div v-if="errorMessage" class="text-negative text-body2 error-message">
      <q-icon name="error_outline" class="q-mr-sm" />
      {{ errorMessage }}
    </div>
    <q-btn
      v-if="showRetryButton"
      label="Try Login Again"
      color="primary"
      icon="refresh"
      @click="retryLogin"
      class="q-mt-lg"
      unelevated
    />
    <div
      v-if="!showRetryButton && !authStore.isAuthenticated && !errorMessage"
      class="text-caption text-grey-7 q-mt-md"
    >
      If this takes too long, please check your internet connection or try again later.
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // 移除 useRoute
import {
  handleOsuCallback as exchangeCodeForToken,
  redirectToOsuLogin,
} from 'src/services/osuAuthService';
import { useAuthStore } from 'src/services/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const statusMessage = ref<string>('Connecting to Osu!...');
const errorMessage = ref<string | null>(null);
const showRetryButton = ref(false);
const isLoading = ref(true);

const spinnerColor = computed(() => (errorMessage.value ? 'negative' : 'primary'));

function processAuthentication(authCode: string | undefined): Promise<void> {
  isLoading.value = true;
  statusMessage.value = 'Authenticating with Osu!...';
  errorMessage.value = null;
  showRetryButton.value = false;

  if (!authCode) {
    errorMessage.value = 'Invalid authorization code received from Osu! via protocol.';
    showRetryButton.value = true;
    isLoading.value = false;
    $q.notify({
      type: 'negative',
      message: errorMessage.value,
      multiLine: true,
      timeout: 7000,
      icon: 'error',
    });
    return Promise.reject(new Error(errorMessage.value));
  }

  return exchangeCodeForToken(authCode)
    .then((tokenExchangeSuccess) => {
      if (tokenExchangeSuccess) {
        statusMessage.value = 'Fetching your Osu! profile...';
        return authStore
          .fetchUserProfile()
          .then(() => {
            if (authStore.user) {
              $q.notify({
                type: 'positive',
                message: `Welcome, ${authStore.user.username}! Successfully logged in.`,
                icon: 'check_circle',
              });
              router.replace({ name: 'settings' }).catch((err) => {
                console.error('Navigation error:', err);
              });
              return Promise.resolve();
            } else {
              throw new Error('User profile could not be loaded after login.');
            }
          })
          .catch((profileError) => {
            console.error('Error fetching profile after login:', profileError);
            const message =
              profileError instanceof Error ? profileError.message : 'Could not load profile.';
            errorMessage.value = `Logged in, but failed to fetch Osu! profile: ${message}`;
            $q.notify({
              type: 'warning',
              message: errorMessage.value,
              multiLine: true,
              timeout: 7000,
              icon: 'warning',
            });
            router.replace({ name: 'settings' }).catch((err) => {
              console.error('Navigation error:', err);
            });
            return Promise.resolve();
          });
      } else {
        errorMessage.value =
          'Authentication failed. Could not exchange authorization code for a token.';
        showRetryButton.value = true;
        $q.notify({
          type: 'negative',
          message: errorMessage.value,
          multiLine: true,
          timeout: 7000,
          icon: 'error',
        });
        return Promise.reject(new Error(errorMessage.value));
      }
    })
    .catch((criticalError) => {
      console.error('Critical error during authentication process:', criticalError);
      const message =
        criticalError instanceof Error ? criticalError.message : 'An unexpected error occurred.';
      errorMessage.value = `Critical authentication error: ${message}`;
      showRetryButton.value = true;
      $q.notify({
        type: 'negative',
        message: errorMessage.value,
        multiLine: true,
        timeout: 7000,
        icon: 'error',
      });
      return Promise.reject(criticalError instanceof Error ? criticalError : new Error(message));
    })
    .finally(() => {
      isLoading.value = false;
    });
}

onMounted(async () => {
  console.log('[OsuCallbackPage] Component mounted successfully.');
  isLoading.value = true;
  statusMessage.value = 'Fetching authorization code...';
  // 优先尝试从主进程拉取 code
  let codeFetched = false;
  try {
    if (window.electron?.ipcRenderer) {
      console.log('[OsuCallbackPage] Requesting pending auth code from main process...');
      const result = await window.electron.ipcRenderer.invoke('get-pending-oauth-code');
      const r = result as { success?: boolean; code?: string; error?: string };
      if (r && r.success && r.code && typeof r.code === 'string') {
        codeFetched = true;
        await processAuthentication(r.code);
      }
    }
  } catch (ipcError) {
    console.error('[OsuCallbackPage] Error invoking IPC for get-pending-oauth-code:', ipcError);
  }
  // 如果没有 code 且未认证，才发起 OAuth 跳转
  if (!authStore.isAuthenticated && !codeFetched) {
    await redirectToOsuLogin();
    return;
  }
  if (!codeFetched && !authStore.isAuthenticated) {
    statusMessage.value = '无法获取授权信息。';
    errorMessage.value = '未能从主程序获取授权码。';
    showRetryButton.value = true;
    isLoading.value = false;
  }
  // 超时逻辑
  const timeoutId = setTimeout(() => {
    if (isLoading.value && !authStore.isAuthenticated && !errorMessage.value) {
      statusMessage.value = '认证过程似乎太长了。';
      errorMessage.value = 'Osu! 或应用无响应。请检查您的网络连接或稍后再试。';
      showRetryButton.value = true;
      isLoading.value = false;
      $q.notify({ type: 'warning', message: errorMessage.value, multiLine: true, timeout: 10000 });
    }
  }, 30000);
  onUnmounted(() => {
    clearTimeout(timeoutId);
  });
});

onUnmounted(() => {
  // 移除旧的 unlistenOauthCode 调用
  // if (unlistenOauthCode) {
  //   unlistenOauthCode();
  // }
});

function retryLogin() {
  errorMessage.value = null;
  showRetryButton.value = false;
  statusMessage.value = 'Retrying login...';
  isLoading.value = true;
  router.push({ name: 'settings' }).catch((err) => {
    console.error('Retry navigation error:', err);
    isLoading.value = false;
  });
}
</script>

<style lang="scss" scoped>
.error-message {
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
  word-break: break-word;
}
</style>
