import React from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppTheme} from '@app/theme/ThemeProvider';

type Props = {
  size?: number;
};

export function BrandMark({size = 112}: Props) {
  const {theme, isDark} = useAppTheme();
  const scale = size / 112;

  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: 28 * scale,
          backgroundColor: isDark ? '#08101B' : '#FFFFFF',
          padding: 14 * scale,
          borderColor: isDark ? 'rgba(123,141,255,0.14)' : 'rgba(23,32,51,0.06)',
        },
      ]}>
      <View
        style={[
          styles.sheet,
          {
            borderRadius: 22 * scale,
            borderColor: theme.colors.primary,
            backgroundColor: isDark ? '#0D1627' : '#F8FBFF',
          },
        ]}>
        <View
          style={[
            styles.fold,
            {
              width: 28 * scale,
              height: 28 * scale,
              borderTopRightRadius: 18 * scale,
              backgroundColor: theme.colors.accent,
            },
          ]}
        />

        <LinearGradient
          colors={[theme.colors.primary, isDark ? '#9BB0FF' : '#4C70FF']}
          start={{x: 0, y: 0.4}}
          end={{x: 1, y: 0.6}}
          style={[
            styles.arcTop,
            {
              width: 52 * scale,
              height: 14 * scale,
              borderRadius: 999,
              top: 36 * scale,
              left: 24 * scale,
            },
          ]}
        />
        <LinearGradient
          colors={[theme.colors.accent, isDark ? '#7EF1CC' : '#10C88F']}
          start={{x: 0, y: 0.4}}
          end={{x: 1, y: 0.6}}
          style={[
            styles.arcBottom,
            {
              width: 52 * scale,
              height: 14 * scale,
              borderRadius: 999,
              bottom: 22 * scale,
              left: 18 * scale,
            },
          ]}
        />
        <View
          style={[
            styles.spark,
            {
              width: 18 * scale,
              height: 18 * scale,
              right: 10 * scale,
              top: 22 * scale,
              backgroundColor: theme.colors.accent,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.base,
          {
            width: 42 * scale,
            height: 12 * scale,
            borderRadius: 999,
            backgroundColor: isDark ? '#9AA7BA' : '#546178',
            opacity: isDark ? 0.9 : 1,
            bottom: 8 * scale,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
  },
  sheet: {
    width: '82%',
    height: '82%',
    borderWidth: 5,
    overflow: 'hidden',
  },
  fold: {
    position: 'absolute',
    right: -1,
    top: -1,
    transform: [{rotate: '45deg'}],
  },
  arcTop: {
    position: 'absolute',
    transform: [{rotate: '-20deg'}],
  },
  arcBottom: {
    position: 'absolute',
    transform: [{rotate: '15deg'}],
  },
  spark: {
    position: 'absolute',
    transform: [{rotate: '45deg'}],
    borderRadius: 4,
  },
  base: {
    position: 'absolute',
  },
});
