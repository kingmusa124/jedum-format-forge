import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppTheme} from '@app/theme/ThemeProvider';

interface Props {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
}

export function SectionCard({title, subtitle, children, style, gradient}: Props) {
  const {theme} = useAppTheme();

  const content = (
    <>
      {title ? (
        <View style={styles.header}>
          <Text style={[styles.title, {color: gradient ? '#FFFFFF' : theme.colors.text}]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, {color: gradient ? 'rgba(255,255,255,0.82)' : theme.colors.textMuted}]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={['#2746C7', theme.colors.primary, '#17C896']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[
          styles.card,
          {
            borderColor: 'transparent',
            shadowColor: theme.colors.shadow,
          },
          style,
        ]}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 12},
    elevation: 6,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
  },
});
