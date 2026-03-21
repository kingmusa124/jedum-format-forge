import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useNavigationTheme} from '@app/theme/ThemeProvider';
import {RootNavigator} from '@app/navigation/RootNavigator';

export function AppNavigationContainer() {
  const theme = useNavigationTheme();

  return (
    <NavigationContainer theme={theme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
