import {useEffect, useState} from 'react';
import {setHistory} from '@app/store/slices/historySlice';
import {
  setCompression,
  setOutputFolder,
  setQuality,
} from '@app/store/slices/conversionSlice';
import {
  AdsConsentStatus,
  PrivacyOptionsRequirementStatus,
  ThemeMode,
  setDefaultCompression,
  setBackendApiKey,
  setBackendUrl,
  setDefaultOutputFolder,
  setDefaultQuality,
  setAdmobAndroidAppId,
  setAdmobIosAppId,
  setAdsConsentInfo,
  setAdsEnabled,
  setPrivacyPolicyAccepted,
  setThemeMode,
} from '@app/store/slices/settingsSlice';
import {useAppDispatch} from '@app/store/hooks';
import {loadHistory, loadSettings} from '@app/services/storageService';
import {setServerApiKey, setServerUrl} from '@app/store/slices/conversionSlice';
import {DEFAULT_BACKEND_URL} from '@app/config/backend';

export function useAppBootstrap() {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootThemeMode, setBootThemeMode] = useState<ThemeMode | null>(null);

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
            privacyPolicyAccepted?: boolean;
            adsConsentStatus?: AdsConsentStatus;
            adsCanRequestAds?: boolean;
            privacyOptionsRequirementStatus?: PrivacyOptionsRequirementStatus;
            isConsentFormAvailable?: boolean;
          }>(),
        ]);

        dispatch(setHistory(history));

        const nextThemeMode = settings?.themeMode || 'system';
        const nextQuality = settings?.defaultQuality ?? 90;
        const nextCompression = settings?.defaultCompression ?? 85;
        const nextOutputFolder =
          settings?.defaultOutputFolder || 'Downloads/JedumFormatForge';
        const nextBackendUrl = settings?.backendUrl || DEFAULT_BACKEND_URL;
        const nextBackendApiKey = settings?.backendApiKey || '';

        setBootThemeMode(nextThemeMode);
        dispatch(setThemeMode(nextThemeMode));
        dispatch(setDefaultQuality(nextQuality));
        dispatch(setDefaultCompression(nextCompression));
        dispatch(setDefaultOutputFolder(nextOutputFolder));
        dispatch(setBackendUrl(nextBackendUrl));
        dispatch(setBackendApiKey(nextBackendApiKey));
        dispatch(setAdsEnabled(!!settings?.adsEnabled));
        dispatch(setAdmobAndroidAppId(settings?.admobAndroidAppId || ''));
        dispatch(setAdmobIosAppId(settings?.admobIosAppId || ''));
        dispatch(setPrivacyPolicyAccepted(!!settings?.privacyPolicyAccepted));
        dispatch(
          setAdsConsentInfo({
            status: settings?.adsConsentStatus || 'UNKNOWN',
            canRequestAds: !!settings?.adsCanRequestAds,
            privacyOptionsRequirementStatus:
              settings?.privacyOptionsRequirementStatus || 'UNKNOWN',
            isConsentFormAvailable: !!settings?.isConsentFormAvailable,
          }),
        );
        dispatch(setQuality(nextQuality));
        dispatch(setCompression(nextCompression));
        dispatch(setOutputFolder(nextOutputFolder));
        dispatch(setServerUrl(nextBackendUrl));
        dispatch(setServerApiKey(nextBackendApiKey));
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

  return {ready, error, bootThemeMode};
}
