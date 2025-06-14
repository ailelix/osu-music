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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // 移除 useRoute
import {
  handleOsuCallback as exchangeCodeForToken,
  redirectToOsuLogin,
} from 'src/services/osuAuthService';
import { useAuthStore } from 'src/services/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();
const route = useRoute();

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
              router.replace({ name: 'authSettings' }).catch((err) => {
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
            router.replace({ name: 'authSettings' }).catch((err) => {
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

async function handleAuthenticationFlow() {
  console.log('[OsuCallbackPage] handleAuthenticationFlow started.');
  isLoading.value = true;
  statusMessage.value = 'Initializing authentication...';
  errorMessage.value = null;
  showRetryButton.value = false;
  const authStore = useAuthStore();
  let codeToProcess = authStore.consumePendingOAuthCode();
  console.log('[OsuCallbackPage] Code from authStore.consumePendingOAuthCode() IS:', codeToProcess);
  console.log('[OsuCallbackPage] Type of codeToProcess:', typeof codeToProcess);
  if (!codeToProcess) {
    const codeFromQuery = route.query.code as string | undefined;
    console.log(
      '[OsuCallbackPage] Store code is null/undefined. Trying route.query.code:',
      codeFromQuery,
    );
    if (codeFromQuery && typeof codeFromQuery === 'string' && codeFromQuery.trim() !== '') {
      codeToProcess = codeFromQuery;
      console.log('[OsuCallbackPage] Using code from route query as fallback:', codeToProcess);
    }
  }
  if (codeToProcess && typeof codeToProcess === 'string' && codeToProcess.trim() !== '') {
    console.log(
      '[OsuCallbackPage] VALID code found. Calling processAuthentication with:',
      codeToProcess,
    );
    await processAuthentication(codeToProcess);
    return;
  }
  if (!authStore.isAuthenticated) {
    console.log(
      '[OsuCallbackPage] NO VALID CODE obtained and not authenticated. Initiating Osu! login.',
    );
    statusMessage.value = 'Redirecting to Osu! for login...';
    try {
      await redirectToOsuLogin();
    } catch (e) {
      console.error('[OsuCallbackPage] Error calling redirectToOsuLogin:', e);
      errorMessage.value =
        (e instanceof Error ? e.message : String(e)) || 'Failed to initiate Osu! login.';
      statusMessage.value = 'Error';
      showRetryButton.value = true;
      isLoading.value = false;
    }
  } else {
    console.warn(
      '[OsuCallbackPage] Authenticated but no code processed. Redirecting to auth settings.',
    );
    statusMessage.value = 'Already authenticated or invalid state.';
    isLoading.value = false;
    void router.replace({ name: 'authSettings' });
  }
}

onMounted(async () => {
  console.log(
    '[OsuCallbackPage] Component mounted. Current route query:',
    JSON.stringify(route.query),
  );
  await handleAuthenticationFlow();
  const timeoutId = setTimeout(() => {
    if (isLoading.value && !authStore.isAuthenticated && !errorMessage.value) {
      // 可选：超时处理逻辑
      console.warn('[OsuCallbackPage] Authentication flow timeout.');
      statusMessage.value = 'Authentication timeout.';
      errorMessage.value = '登录流程超时，请重试。';
      showRetryButton.value = true;
      isLoading.value = false;
    }
  }, 30000);
  onUnmounted(() => {
    clearTimeout(timeoutId);
  });
});

let isProcessingTChange = false;
watch(
  () => route.query.t,
  async (newT, oldT) => {
    if (newT && newT !== oldT && !isProcessingTChange) {
      isProcessingTChange = true;
      console.log('[OsuCallbackPage] Route param t changed, re-initiating authentication flow.');
      await handleAuthenticationFlow();
      isProcessingTChange = false;
    }
  },
  { immediate: true },
);

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
  router.push({ name: 'authSettings' }).catch((err) => {
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
