import {TestIds} from 'react-native-google-mobile-ads';

export const USE_TEST_ADS = true;

export const PRODUCTION_AD_UNIT_PLACEHOLDERS = {
  android: {
    banner: 'ca-app-pub-3481471497123081/2558449065',
    interstitial: 'ca-app-pub-3481471497123081/6890511516',
    rewarded: 'ca-app-pub-3481471497123081/6603437607',
  },
  ios: {
    banner: 'ca-app-pub-xxxxxxxxxxxxxxxx/ios-banner',
    interstitial: 'ca-app-pub-xxxxxxxxxxxxxxxx/ios-interstitial',
    rewarded: 'ca-app-pub-xxxxxxxxxxxxxxxx/ios-rewarded',
  },
};

export const AD_UNITS = USE_TEST_ADS
  ? {
      android: {
        banner: TestIds.BANNER,
        interstitial: TestIds.INTERSTITIAL,
        rewarded: TestIds.REWARDED,
      },
      ios: {
        banner: TestIds.BANNER,
        interstitial: TestIds.INTERSTITIAL,
        rewarded: TestIds.REWARDED,
      },
    }
  : PRODUCTION_AD_UNIT_PLACEHOLDERS;
