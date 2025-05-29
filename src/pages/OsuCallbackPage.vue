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
import { useRouter, useRoute } from 'vue-router'; // 新增 useRoute
import { handleOsuCallback as exchangeCodeForToken } from 'src/services/osuAuthService';
import { useAuthStore } from 'src/services/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const route = useRoute(); // 新增
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

onMounted(() => {
  console.log('[OsuCallbackPage] Component mounted successfully.');
  const authCodeFromQuery = route.query.code as string | undefined;
  console.log('[OsuCallbackPage] Attempting to get authCode from route query:', authCodeFromQuery);
  if (
    authCodeFromQuery &&
    typeof authCodeFromQuery === 'string' &&
    authCodeFromQuery.trim() !== ''
  ) {
    processAuthentication(authCodeFromQuery)
      .then(() => {
        console.log('Authentication process completed via route query code.');
      })
      .catch((err) => {
        console.error('Error from processAuthentication promise chain (route query code):', err);
        if (!errorMessage.value) {
          errorMessage.value = '登录过程中发生意外错误。';
          showRetryButton.value = true;
        }
      });
  } else {
    statusMessage.value = '未在回调中找到授权码。';
    errorMessage.value = '无法获取授权码。请尝试重新登录。';
    showRetryButton.value = true;
    isLoading.value = false;
    $q.notify({
      type: 'negative',
      message: errorMessage.value,
      multiLine: true,
      timeout: 7000,
      icon: 'error',
    });
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
