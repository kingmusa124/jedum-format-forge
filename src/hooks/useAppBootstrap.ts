import {useEffect, useState} from 'react';
import {setHistory} from '@app/store/slices/historySlice';
import {
  setCompression,
  setOutputFolder,
  setQuality,
} from '@app/store/slices/conversionSlice';
import {
  setDefaultCompression,
  setBackendApiKey,
  setBackendUrl,
  setDefaultOutputFolder,
  setDefaultQuality,
  setAdmobAndroidAppId,
  setAdmobIosAppId,
  setAdsEnabled,
  setThemeMode,
} from '@app/store/slices/settingsSlice';
import {useAppDispatch} from '@app/store/hooks';
import {loadHistory, loadSettings} from '@app/services/storageService';
import {setServerApiKey, setServerUrl} from '@app/store/slices/conversionSlice';

export function useAppBootstrap() {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function hydrate() {
      try {
        const [history, settings] = await Promise.all([
          loadHistory(),
          loadSettings<{
            themeMode: 'light' | 'dark' | 'system';
            defaultQuality: number;
            defaultCompression: number;
            defaultOutputFolder: string;
            backendUrl?: string;
            backendApiKey?: string;
            adsEnabled?: boolean;
            admobAndroidAppId?: string;
            admobIosAppId?: string;
          }>(),
        ]);

        dispatch(setHistory(history));

        if (settings) {
          dispatch(setThemeMode(settings.themeMode));
          dispatch(setDefaultQuality(settings.defaultQuality));
          dispatch(setDefaultCompression(settings.defaultCompression));
          dispatch(setDefaultOutputFolder(settings.defaultOutputFolder));
          dispatch(setBackendUrl(settings.backendUrl || 'http://10.0.2.2:4000/api/convert'));
          dispatch(setBackendApiKey(settings.backendApiKey || ''));
          dispatch(setAdsEnabled(!!settings.adsEnabled));
          dispatch(setAdmobAndroidAppId(settings.admobAndroidAppId || ''));
          dispatch(setAdmobIosAppId(settings.admobIosAppId || ''));
          dispatch(setQuality(settings.defaultQuality));
          dispatch(setCompression(settings.defaultCompression));
          dispatch(setOutputFolder(settings.defaultOutputFolder));
          dispatch(setServerUrl(settings.backendUrl || 'http://10.0.2.2:4000/api/convert'));
          dispatch(setServerApiKey(settings.backendApiKey || ''));
        }
      } catch (bootstrapError) {
        const message =
          bootstrapError instanceof Error
            ? bootstrapError.message
            : 'Unknown bootstrap error';
        console.error('App bootstrap failed', bootstrapError);
        setError(message);
      } finally {
        setReady(true);
      }
    }

    hydrate();
  }, [dispatch]);

  return {ready, error};
}
