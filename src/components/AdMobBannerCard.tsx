import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {AD_UNITS} from '@app/config/ads';
import {useAppTheme} from '@app/theme/ThemeProvider';

export function AdMobBannerCard({
  enabled,
  canRequestAds,
}: {
  enabled: boolean;
  canRequestAds: boolean;
}) {
  const {theme} = useAppTheme();

  if (!enabled) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>AdMob test preview</Text>
      <Text style={[styles.caption, {color: theme.colors.textMuted}]}>
        Test ads stay safe during development. Keep production ad units disabled until consent, privacy, and store content are ready.
      </Text>
      {canRequestAds ? (
        <View style={styles.bannerWrap}>
          <BannerAd
            unitId={Platform.OS === 'ios' ? AD_UNITS.ios.banner : AD_UNITS.android.banner}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{requestNonPersonalizedAdsOnly: false}}
          />
        </View>
      ) : (
        <View
          style={[
            styles.bannerWrap,
            styles.bannerPlaceholder,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <Text style={[styles.placeholderText, {color: theme.colors.textMuted}]}>
            Ads stay off until Google consent allows ad requests on this device.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
  },
  bannerWrap: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholder: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  placeholderText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
