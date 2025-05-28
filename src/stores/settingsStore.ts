import { defineStore } from 'pinia';

interface AppSettings {
  osuClientId: string | null;
  osuClientSecret: string | null;
}

// Removed SettingsState as it is equivalent to AppSettings

const defaultSettings: AppSettings = {
  osuClientId: null,
  osuClientSecret: null,
};

export const useSettingsStore = defineStore('settings', {
  state: (): AppSettings => ({
    ...defaultSettings,
  }),
  getters: {
    areCredentialsSet: (state): boolean => !!state.osuClientId && !!state.osuClientSecret,
  },
  actions: {
    initializeSettings() {
      console.log('[SettingsStore] Initialized (in-memory for Client ID/Secret).');
    },
    saveSettings(settingsToSave: Partial<AppSettings>) {
      console.log('[SettingsStore] saveSettings (in-memory) called with:', settingsToSave);
      if (settingsToSave.osuClientId !== undefined) {
        this.osuClientId = settingsToSave.osuClientId?.trim() || null;
      }
      if (settingsToSave.osuClientSecret !== undefined) {
        this.osuClientSecret = settingsToSave.osuClientSecret?.trim() || null;
      }
      console.log(
        '[SettingsStore] In-memory state updated. ClientID:',
        this.osuClientId,
        'ClientSecret:',
        this.osuClientSecret ? '***' : null,
      );
    },
    clearOsuCredentials() {
      this.osuClientId = null;
      this.osuClientSecret = null;
      console.log('[SettingsStore] In-memory credentials cleared.');
    },
  },
});
