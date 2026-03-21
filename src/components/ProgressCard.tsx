import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ConversionProgress} from '@app/types/files';
import {useAppTheme} from '@app/theme/ThemeProvider';
import {formatEta} from '@app/utils/formatters';

export function ProgressCard({progress}: {progress: ConversionProgress}) {
  const {theme} = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}>
      <View style={styles.row}>
        <Text style={[styles.title, {color: theme.colors.text}]}>Conversion progress</Text>
        <Text style={[styles.percent, {color: theme.colors.primary}]}>{progress.percent}%</Text>
      </View>
      <View style={[styles.track, {backgroundColor: theme.colors.border}]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: theme.colors.primary,
              width: `${Math.min(Math.max(progress.percent, 0), 100)}%`,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <Text style={[styles.caption, {color: theme.colors.textMuted}]}>{progress.stage}</Text>
        <Text style={[styles.caption, {color: theme.colors.textMuted}]}>{formatEta(progress.etaSeconds)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
  },
  percent: {
    fontSize: 15,
    fontWeight: '700',
  },
  track: {
    height: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 12,
  },
  caption: {
    fontSize: 12,
  },
});
