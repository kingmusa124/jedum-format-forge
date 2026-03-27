import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Appearance, StatusBar, Text, View} from 'react-native';
import {Provider} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {store} from '@app/store';
import {AppNavigationContainer} from '@app/navigation/AppNavigationContainer';
import {BrandMark} from '@app/components/BrandMark';
import {ThemeProvider, useAppTheme} from '@app/theme/ThemeProvider';
import {useAppBootstrap} from '@app/hooks/useAppBootstrap';
import {darkColors, lightColors} from '@app/theme/colors';
import {useAppSelector} from '@app/store/hooks';
import {initializeAdMob} from '@app/services/admobService';

function AppChrome() {
  const {theme, isDark} = useAppTheme();
  const {ready, error, bootThemeMode} = useAppBootstrap();
  const adsEnabled = useAppSelector(state => state.settings.adsEnabled);
  const systemScheme = Appearance.getColorScheme();
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [showSplashOverlay, setShowSplashOverlay] = useState(true);

  useEffect(() => {
    void initializeAdMob(adsEnabled);
  }, [adsEnabled]);

  useEffect(() => {
    if (!ready) {
      splashOpacity.setValue(1);
      setShowSplashOverlay(true);
      return;
    }

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setShowSplashOverlay(false);
    });
  }, [ready, splashOpacity]);

  const welcomeIsDark = useMemo(() => {
    if (ready) {
      return isDark;
    }

    if (bootThemeMode === 'dark') {
      return true;
    }

    if (bootThemeMode === 'light') {
      return false;
    }

    return systemScheme === 'dark';
  }, [bootThemeMode, isDark, ready, systemScheme]);

  const welcomeColors = welcomeIsDark ? darkColors : lightColors;

  return (
    <View style={{flex: 1, backgroundColor: ready ? theme.colors.background : welcomeColors.background}}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={ready ? theme.colors.background : welcomeColors.background}
      />
      {ready ? (
        error ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
              backgroundColor: theme.colors.background,
            }}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 24,
                fontWeight: '800',
                textAlign: 'center',
                marginBottom: 12,
              }}>
              Jedum Format Forge
            </Text>
            <Text
              style={{
                color: theme.colors.danger,
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 8,
              }}>
              Startup recovered from an error
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                fontSize: 14,
                lineHeight: 20,
                textAlign: 'center',
              }}>
              {error}
            </Text>
          </View>
        ) : (
          <AppNavigationContainer />
        )
      ) : null}

      {showSplashOverlay ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: splashOpacity,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            backgroundColor: welcomeColors.background,
          }}>
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: 18,
              width: '100%',
              maxWidth: 360,
            }}>
            <View
              style={{
                width: 176,
                height: 176,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: welcomeColors.card,
                borderWidth: 1,
                borderColor: welcomeColors.border,
                shadowColor: welcomeColors.shadow,
                shadowOpacity: 0.12,
                shadowRadius: 22,
                shadowOffset: {width: 0, height: 12},
                elevation: 6,
              }}>
              <BrandMark size={132} />
            </View>
            <Text
              style={{
                color: welcomeColors.text,
                fontSize: 28,
                fontWeight: '800',
                textAlign: 'center',
                marginTop: 22,
                letterSpacing: -0.8,
              }}>
              Jedum Format Forge
            </Text>
            <Text
              style={{
                color: welcomeColors.textMuted,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 21,
              }}>
              Local-first conversion in a cleaner workspace for modern file tasks
            </Text>
            <ActivityIndicator color={welcomeColors.primary} size="large" style={{marginTop: 26}} />
            <View
              style={{
                marginTop: 30,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: welcomeColors.surface,
                borderWidth: 1,
                borderColor: welcomeColors.border,
              }}>
              <Text
                style={{
                  color: welcomeColors.textMuted,
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 1.1,
                }}>
                FROM JGS
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppChrome />
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
