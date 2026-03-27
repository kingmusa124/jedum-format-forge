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
        <View style={[styles.percentBadge, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <Text style={[styles.percent, {color: theme.colors.primary}]}>{progress.percent}%</Text>
        </View>
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
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 12},
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 15,
  },
  percentBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  percent: {
    fontSize: 13,
    fontWeight: '800',
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
