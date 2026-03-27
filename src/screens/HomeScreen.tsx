import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabParamList} from '@app/navigation/types';
import {Screen} from '@app/components/Screen';
import {SectionCard} from '@app/components/SectionCard';
import {PrimaryButton} from '@app/components/PrimaryButton';
import {SymbolIcon} from '@app/components/SymbolIcon';
import {BrandMark} from '@app/components/BrandMark';
import {useAppTheme} from '@app/theme/ThemeProvider';
import {useAppSelector} from '@app/store/hooks';
import {formatDate} from '@app/utils/formatters';

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
  const {theme, isDark} = useAppTheme();
  const history = useAppSelector(state => state.history.items.slice(0, 3));

  return (
    <Screen>
      <View
        style={[
          styles.heroShell,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOpacity: isDark ? 0.12 : 0.08,
            elevation: isDark ? 6 : 3,
          },
        ]}>
        <View style={styles.heroTop}>
          <View
            style={[
              styles.logoFrame,
              {
                backgroundColor: theme.colors.surface,
                borderColor: isDark ? theme.colors.border : '#E1E7F2',
              },
            ]}>
            <BrandMark size={54} />
          </View>
          <View
            style={[
              styles.heroPill,
              {
                backgroundColor: isDark ? theme.colors.surface : '#F5F8FD',
                borderColor: isDark ? theme.colors.border : '#D8E0EE',
              },
            ]}>
            <Text style={[styles.heroPillText, {color: theme.colors.textMuted}]}>Local first. Cloud when needed.</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, {color: theme.colors.text}]}>Jedum Format Forge</Text>
          <Text style={[styles.heroText, {color: theme.colors.textMuted}]}>
            Clean file conversion for images, documents, sheets, and slides.
          </Text>
        </View>

        <PrimaryButton label="Start converting" onPress={() => navigation.navigate('Convert')} compact />
      </View>

      <SectionCard title="Recent conversions">
        {history.length ? (
          history.map(item => (
            <View key={item.id} style={[styles.historyRow, {borderBottomColor: theme.colors.border}]}>
              <SymbolIcon name="file" size={18} color={theme.colors.primary} />
              <View style={{flex: 1}}>
                <Text style={[styles.historyTitle, {color: theme.colors.text}]}>
                  {item.outputFormat.toUpperCase()} - {item.status}
                </Text>
                <Text style={[styles.historyMeta, {color: theme.colors.textMuted}]}>
                  {item.outputFiles.length} file(s) - {formatDate(item.finishedAt || item.createdAt)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, {color: theme.colors.textMuted}]}>No conversion history yet.</Text>
        )}
      </SectionCard>

      <SectionCard title="Helpful tips">
        <Text style={[styles.tipText, {color: theme.colors.textMuted}]}>
          Images to PDF looks best with clear JPG or PNG inputs.
        </Text>
        <Text style={[styles.tipText, {color: theme.colors.textMuted}]}>
          Cloud-only converters will use your own backend when that setup is ready.
        </Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroShell: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 18,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 14},
    elevation: 6,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 320,
  },
  logoFrame: {
    width: 70,
    height: 70,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
});
