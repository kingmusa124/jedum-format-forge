import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '@app/theme/ThemeProvider';

type Props = {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};

export function ValueStepper({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  suffix = '',
  onChange,
}: Props) {
  const {theme} = useAppTheme();

  const applyDelta = (delta: number) => {
    const nextValue = Math.min(maximumValue, Math.max(minimumValue, value + delta));
    onChange(nextValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, {color: theme.colors.text}]}>{label}</Text>
        <Text style={[styles.value, {color: theme.colors.primary}]}>
          {value}
          {suffix}
        </Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={() => applyDelta(-step)}
          style={[styles.button, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <Text style={[styles.buttonText, {color: theme.colors.text}]}>-</Text>
        </Pressable>
        <View style={[styles.track, {backgroundColor: theme.colors.border}]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: theme.colors.primary,
                width: `${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
              },
            ]}
          />
        </View>
        <Pressable
          onPress={() => applyDelta(step)}
          style={[styles.button, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <Text style={[styles.buttonText, {color: theme.colors.text}]}>+</Text>
        </Pressable>
      </View>
      <Text style={[styles.range, {color: theme.colors.textMuted}]}>
        Range: {minimumValue}
        {suffix} - {maximumValue}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  range: {
    fontSize: 12,
  },
});
