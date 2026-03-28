import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DEFAULT_BACKEND_URL} from '@app/config/backend';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AdsConsentStatus = 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED' | 'OBTAINED';
export type PrivacyOptionsRequirementStatus = 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED';

interface SettingsState {
  themeMode: ThemeMode;
  defaultQuality: number;
  defaultCompression: number;
  defaultOutputFolder: string;
  backendUrl: string;
  backendApiKey: string;
  adsEnabled: boolean;
  admobAndroidAppId: string;
  admobIosAppId: string;
  privacyPolicyAccepted: boolean;
  adsConsentStatus: AdsConsentStatus;
  adsCanRequestAds: boolean;
  privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus;
  isConsentFormAvailable: boolean;
  keepHistory: boolean;
}

const initialState: SettingsState = {
  themeMode: 'system',
  defaultQuality: 90,
  defaultCompression: 85,
  defaultOutputFolder: 'Downloads/JedumFormatForge',
  backendUrl: DEFAULT_BACKEND_URL,
  backendApiKey: '',
  adsEnabled: false,
  admobAndroidAppId: '',
  admobIosAppId: '',
  privacyPolicyAccepted: false,
  adsConsentStatus: 'UNKNOWN',
  adsCanRequestAds: false,
  privacyOptionsRequirementStatus: 'UNKNOWN',
  isConsentFormAvailable: false,
  keepHistory: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setDefaultQuality(state, action: PayloadAction<number>) {
      state.defaultQuality = action.payload;
    },
    setDefaultCompression(state, action: PayloadAction<number>) {
      state.defaultCompression = action.payload;
    },
    setDefaultOutputFolder(state, action: PayloadAction<string>) {
      state.defaultOutputFolder = action.payload;
    },
    setBackendUrl(state, action: PayloadAction<string>) {
      state.backendUrl = action.payload;
    },
    setBackendApiKey(state, action: PayloadAction<string>) {
      state.backendApiKey = action.payload;
    },
    setAdsEnabled(state, action: PayloadAction<boolean>) {
      state.adsEnabled = action.payload;
    },
    setAdmobAndroidAppId(state, action: PayloadAction<string>) {
      state.admobAndroidAppId = action.payload;
    },
    setAdmobIosAppId(state, action: PayloadAction<string>) {
      state.admobIosAppId = action.payload;
    },
    setPrivacyPolicyAccepted(state, action: PayloadAction<boolean>) {
      state.privacyPolicyAccepted = action.payload;
    },
    setAdsConsentInfo(
      state,
      action: PayloadAction<{
        status: AdsConsentStatus;
        canRequestAds: boolean;
        privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus;
        isConsentFormAvailable: boolean;
      }>,
    ) {
      state.adsConsentStatus = action.payload.status;
      state.adsCanRequestAds = action.payload.canRequestAds;
      state.privacyOptionsRequirementStatus = action.payload.privacyOptionsRequirementStatus;
      state.isConsentFormAvailable = action.payload.isConsentFormAvailable;
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const {
  setThemeMode,
  setDefaultQuality,
  setDefaultCompression,
  setDefaultOutputFolder,
  setBackendUrl,
  setBackendApiKey,
  setAdsEnabled,
  setAdmobAndroidAppId,
  setAdmobIosAppId,
  setPrivacyPolicyAccepted,
  setAdsConsentInfo,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
