import mobileAds, {AdsConsent} from 'react-native-google-mobile-ads';

export type AdConsentSnapshot = {
  status: 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED' | 'OBTAINED';
  canRequestAds: boolean;
  privacyOptionsRequirementStatus: 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED';
  isConsentFormAvailable: boolean;
};

let hasInitializedAds = false;

export async function initializeAdMob(
  enabled: boolean,
  canRequestAds: boolean,
) {
  if (!enabled || !canRequestAds || hasInitializedAds) {
    return;
  }

  try {
    await mobileAds().initialize();
    hasInitializedAds = true;
  } catch (error) {
    console.warn('AdMob initialization skipped', error);
  }
}

export async function refreshAdConsentInfo(): Promise<AdConsentSnapshot> {
  return AdsConsent.requestInfoUpdate();
}

export async function gatherAdConsent(): Promise<AdConsentSnapshot> {
  return AdsConsent.gatherConsent();
}

export async function getAdConsentInfo(): Promise<AdConsentSnapshot> {
  return AdsConsent.getConsentInfo();
}

export async function openAdPrivacyOptions(): Promise<AdConsentSnapshot> {
  return AdsConsent.showPrivacyOptionsForm();
}

export async function syncAdConsentOnLaunch(): Promise<AdConsentSnapshot> {
  await AdsConsent.requestInfoUpdate();
  return AdsConsent.loadAndShowConsentFormIfRequired();
}
