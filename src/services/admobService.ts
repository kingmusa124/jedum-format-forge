import mobileAds from 'react-native-google-mobile-ads';

let hasInitializedAds = false;

export async function initializeAdMob(enabled: boolean) {
  if (!enabled || hasInitializedAds) {
    return;
  }

  try {
    await mobileAds().initialize();
    hasInitializedAds = true;
  } catch (error) {
    console.warn('AdMob initialization skipped', error);
  }
}
