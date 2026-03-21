import React, {createContext, useContext, useMemo} from 'react';
import {Appearance} from 'react-native';
import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {darkColors, lightColors} from '@app/theme/colors';
import {useAppSelector} from '@app/store/hooks';

type ThemeContextValue = {
  theme: {
    colors: typeof lightColors;
    spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number>;
    radius: Record<'sm' | 'md' | 'lg' | 'xl', number>;
  };
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const themeMode = useAppSelector(state => state.settings.themeMode);
  const scheme = Appearance.getColorScheme();

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return scheme === 'dark';
    }
    return themeMode === 'dark';
  }, [scheme, themeMode]);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      theme: {
        colors,
        spacing: {xs: 4, sm: 10, md: 16, lg: 24, xl: 32},
        radius: {sm: 12, md: 18, lg: 26, xl: 34},
      },
      isDark,
    }),
    [colors, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return context;
}

export function useNavigationTheme() {
  const {theme, isDark} = useAppTheme();
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
      notification: theme.colors.accent,
    },
  };
}
