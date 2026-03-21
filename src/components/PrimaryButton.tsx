import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import {useAppTheme} from '@app/theme/ThemeProvider';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  compact?: boolean;
}

export function PrimaryButton({label, onPress, disabled, loading, secondary, compact}: Props) {
  const {theme} = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.button,
        compact ? styles.compactButton : null,
        {
          backgroundColor: secondary ? theme.colors.surface : theme.colors.primary,
          borderColor: secondary ? theme.colors.border : theme.colors.primary,
          opacity: disabled ? 0.45 : 1,
          transform: [{scale: pressed && !disabled ? 0.985 : 1}],
          shadowColor: secondary ? 'transparent' : theme.colors.shadow,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={secondary ? theme.colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.label, {color: secondary ? theme.colors.text : '#FFFFFF'}]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  compactButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
