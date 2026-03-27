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
  const isSecondary = Boolean(secondary);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.button,
        compact ? styles.compactButton : null,
        {
          backgroundColor: isSecondary ? theme.colors.surface : theme.colors.primary,
          borderColor: isSecondary ? theme.colors.border : theme.colors.primary,
          opacity: disabled ? 0.4 : 1,
          transform: [{scale: pressed && !disabled ? 0.982 : 1}],
          shadowColor: isSecondary ? 'transparent' : theme.colors.shadow,
          shadowOpacity: isSecondary ? 0 : 0.22,
          shadowRadius: isSecondary ? 0 : 18,
          shadowOffset: isSecondary ? {width: 0, height: 0} : {width: 0, height: 10},
          elevation: isSecondary ? 0 : 5,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={isSecondary ? theme.colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.label, {color: isSecondary ? theme.colors.text : '#FFFFFF'}]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  compactButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
