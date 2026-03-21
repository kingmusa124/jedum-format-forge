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
  const {theme} = useAppTheme();
  const history = useAppSelector(state => state.history.items.slice(0, 3));

  return (
    <Screen>
      <SectionCard
        gradient
        title="Jedum Format Forge"
        subtitle="Clean file conversion for images, documents, sheets, and slides.">
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <BrandMark size={92} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroText}>A focused workspace for modern file conversion on mobile.</Text>
              <PrimaryButton label="Start converting" onPress={() => navigation.navigate('Convert')} compact />
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Recent conversions" subtitle="Jump back into the latest output from your workspace.">
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

      <SectionCard title="Quick notes" subtitle="A few small reminders while the app is still being refined.">
        <Text style={[styles.tipText, {color: theme.colors.textMuted}]}>Images to PDF looks best with clear JPG or PNG inputs.</Text>
        <Text style={[styles.tipText, {color: theme.colors.textMuted}]}>Cloud-only converters will use your own backend when that setup is ready.</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  heroCopy: {
    flex: 1,
    gap: 14,
  },
  heroText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
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
