import React from 'react';
import {ActivityIndicator, StatusBar, Text, View} from 'react-native';
import {Provider} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {store} from '@app/store';
import {AppNavigationContainer} from '@app/navigation/AppNavigationContainer';
import {BrandMark} from '@app/components/BrandMark';
import {ThemeProvider, useAppTheme} from '@app/theme/ThemeProvider';
import {useAppBootstrap} from '@app/hooks/useAppBootstrap';

function AppChrome() {
  const {theme, isDark} = useAppTheme();
  const {ready, error} = useAppBootstrap();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 84,
          paddingBottom: 34,
          paddingHorizontal: 24,
          backgroundColor: theme.colors.background,
        }}>
        <View />
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: 18,
          }}>
          <BrandMark size={144} />
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 28,
              fontWeight: '800',
              textAlign: 'center',
              marginTop: 24,
              letterSpacing: -0.6,
            }}>
            Jedum Format Forge
          </Text>
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: 15,
              textAlign: 'center',
              marginTop: 10,
              lineHeight: 22,
            }}>
            Local-first conversion with a cleaner, sharper workspace
          </Text>
          <ActivityIndicator color={theme.colors.primary} size="large" style={{marginTop: 28}} />
        </View>
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 2,
          }}>
          FROM JGS
        </Text>
      </View>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AppNavigationContainer />
    </>
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
