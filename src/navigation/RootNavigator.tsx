import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Platform} from 'react-native';
import {RootStackParamList, TabParamList} from '@app/navigation/types';
import {SymbolIcon} from '@app/components/SymbolIcon';
import {HomeScreen} from '@app/screens/HomeScreen';
import {ConvertScreen} from '@app/screens/ConvertScreen';
import {HistoryScreen} from '@app/screens/HistoryScreen';
import {SettingsScreen} from '@app/screens/SettingsScreen';
import {ConversionResultScreen} from '@app/screens/ConversionResultScreen';
import {useAppTheme} from '@app/theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const {theme, isDark} = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(10,16,26,0.94)' : 'rgba(250,252,255,0.96)',
          borderTopColor: 'transparent',
          height: 82,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 12 : 10,
          marginHorizontal: 20,
          marginBottom: 16,
          borderRadius: 28,
          position: 'absolute',
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.34,
          shadowRadius: 24,
          shadowOffset: {width: 0, height: 14},
          elevation: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(123,141,255,0.16)' : 'rgba(65,103,255,0.12)',
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          marginTop: 2,
        },
        tabBarIcon: ({color, size}) => {
          const icons: Record<keyof TabParamList, string> = {
            Home: 'home',
            Convert: 'refresh-cw',
            History: 'clock',
            Settings: 'settings',
          };
          return (
            <SymbolIcon
              name={icons[route.name] as 'home' | 'refresh-cw' | 'clock' | 'settings'}
              color={color}
              size={size}
            />
          );
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Convert" component={ConvertScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const {theme} = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.background},
        headerTintColor: theme.colors.text,
        contentStyle: {backgroundColor: theme.colors.background},
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}>
      <Stack.Screen name="Tabs" component={Tabs} options={{headerShown: false}} />
      <Stack.Screen
        name="ConversionResult"
        component={ConversionResultScreen}
        options={{title: 'Conversion Result'}}
      />
    </Stack.Navigator>
  );
}
