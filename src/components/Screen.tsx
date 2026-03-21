import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppTheme} from '@app/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ViewStyle;
}

export function Screen({children, refreshing, onRefresh, contentContainerStyle}: Props) {
  const {theme} = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: theme.spacing.sm + insets.top,
          paddingBottom: theme.spacing.xl + insets.bottom + 104,
        },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    gap: 18,
  },
});
