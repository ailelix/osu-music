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
    <div v-if="!showRetryButton && !authStore.isAuthenticated && !errorMessage" class="text-caption text-grey-7 q-mt-md">
      If this takes too long, please check your internet connection or try again later.
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { handleOsuCallback as exchangeCodeForToken } from 'src/services/osuAuthService';
import { useAuthStore } from 'src/services/auth';
import { useQuasar } from 'quasar';
import type { IpcRendererEvent } from 'electron';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const statusMessage = ref<string>('Connecting to Osu!...');
const errorMessage = ref<string | null>(null);
const showRetryButton = ref(false);
const isLoading = ref(true);

let unlistenOauthCode: (() => void) | undefined;

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
    $q.notify({ type: 'negative', message: errorMessage.value, multiLine: true, timeout: 7000, icon: 'error' });
    return Promise.reject(new Error(errorMessage.value));
  }

  return exchangeCodeForToken(authCode)
    .then(tokenExchangeSuccess => {
      if (tokenExchangeSuccess) {
        statusMessage.value = 'Fetching your Osu! profile...';
        return authStore.fetchUserProfile()
          .then(() => {
            if (authStore.user) {
              $q.notify({
                type: 'positive',
                message: `Welcome, ${authStore.user.username}! Successfully logged in.`,
                icon: 'check_circle',
              });
              router.replace({ name: 'settings' }).catch(err => {
                console.error("Navigation error:", err);
              });
              return Promise.resolve();
            } else {
              throw new Error('User profile could not be loaded after login.');
            }
          })
          .catch(profileError => {
            console.error("Error fetching profile after login:", profileError);
            const message = profileError instanceof Error ? profileError.message : 'Could not load profile.';
            errorMessage.value = `Logged in, but failed to fetch Osu! profile: ${message}`;
            $q.notify({ type: 'warning', message: errorMessage.value, multiLine: true, timeout: 7000, icon: 'warning' });
            router.replace({ name: 'settings' }).catch(err => {
              console.error("Navigation error:", err);
            });
            return Promise.resolve();
          });
      } else {
        errorMessage.value = 'Authentication failed. Could not exchange authorization code for a token.';
        showRetryButton.value = true;
        $q.notify({ type: 'negative', message: errorMessage.value, multiLine: true, timeout: 7000, icon: 'error' });
        return Promise.reject(new Error(errorMessage.value));
      }
    })
    .catch(criticalError => {
      console.error("Critical error during authentication process:", criticalError);
      const message = criticalError instanceof Error ? criticalError.message : 'An unexpected error occurred.';
      errorMessage.value = `Critical authentication error: ${message}`;
      showRetryButton.value = true;
      $q.notify({ type: 'negative', message: errorMessage.value, multiLine: true, timeout: 7000, icon: 'error' });
      return Promise.reject(criticalError instanceof Error ? criticalError : new Error(message));
    })
    .finally(() => {
      isLoading.value = false;
    });
}

onMounted(() => {
  console.log('[OsuCallbackPage] Component mounted successfully.');
  if (window.electron?.ipcRenderer) {
    unlistenOauthCode = window.electron.ipcRenderer.on(
      'oauth-code-received-protocol',
      (_event: IpcRendererEvent, authCodeParam: unknown) => {
        console.log('[OsuCallbackPage] Received event "oauth-code-received-protocol" with authCode:', authCodeParam);
        const authCode = typeof authCodeParam === 'string' ? authCodeParam : undefined;
        processAuthentication(authCode)
          .then(() => {
            console.log("Authentication process completed.");
          })
          .catch(err => {
            console.error("Error from processAuthentication promise chain:", err);
            if (!errorMessage.value) {
              errorMessage.value = "An unexpected error occurred during the login process.";
              showRetryButton.value = true;
            }
          });
      }
    );

    const timeoutId = setTimeout(() => {
      if (isLoading.value && !authStore.isAuthenticated && !errorMessage.value) {
        statusMessage.value = "Authentication seems to be taking too long.";
        errorMessage.value = "No response from Osu! or app. Please check your connection or try again.";
        showRetryButton.value = true;
        isLoading.value = false;
        $q.notify({ type: 'warning', message: errorMessage.value, multiLine: true, timeout: 10000 });
      }
    }, 30000);

    onUnmounted(() => clearTimeout(timeoutId));
  } else {
    statusMessage.value = 'Login via Osu! is only available in the desktop application.';
    errorMessage.value = 'Unsupported environment for Osu! login.';
    showRetryButton.value = false;
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (unlistenOauthCode) {
    unlistenOauthCode();
  }
});

function retryLogin() {
  errorMessage.value = null;
  showRetryButton.value = false;
  statusMessage.value = 'Retrying login...';
  isLoading.value = true;
  router.push({ name: 'settings' }).catch(err => {
    console.error("Retry navigation error:", err);
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
