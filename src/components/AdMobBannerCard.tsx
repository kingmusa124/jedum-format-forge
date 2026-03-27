import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';
import {useAppTheme} from '@app/theme/ThemeProvider';

export function AdMobBannerCard({enabled}: {enabled: boolean}) {
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
      <View style={styles.bannerWrap}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{requestNonPersonalizedAdsOnly: true}}
        />
      </View>
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
});
