import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

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
  keepHistory: boolean;
}

const initialState: SettingsState = {
  themeMode: 'system',
  defaultQuality: 90,
  defaultCompression: 85,
  defaultOutputFolder: 'Downloads/JedumFormatForge',
  backendUrl: 'http://10.0.2.2:4000/api/convert',
  backendApiKey: '',
  adsEnabled: false,
  admobAndroidAppId: '',
  admobIosAppId: '',
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
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
