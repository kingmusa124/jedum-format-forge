import React from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabParamList} from '@app/navigation/types';
import {Screen} from '@app/components/Screen';
import {SectionCard} from '@app/components/SectionCard';
import {PrimaryButton} from '@app/components/PrimaryButton';
import {SymbolIcon} from '@app/components/SymbolIcon';
import {useAppDispatch, useAppSelector} from '@app/store/hooks';
import {deleteHistoryItem, setHistoryFilter} from '@app/store/slices/historySlice';
import {saveHistory, shareFile, openFile} from '@app/services/storageService';
import {formatDate} from '@app/utils/formatters';
import {useAppTheme} from '@app/theme/ThemeProvider';

type Props = BottomTabScreenProps<TabParamList, 'History'>;

const FILTERS = ['all', 'pdf', 'image', 'webp'] as const;

export function HistoryScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const {theme} = useAppTheme();
  const {items, filter} = useAppSelector(state => state.history);

  const filteredItems = items.filter(item => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'pdf') {
      return item.outputFormat === 'pdf';
    }
    if (filter === 'webp') {
      return item.outputFormat === 'webp';
    }
    return item.outputFormat === 'png' || item.outputFormat === 'jpg';
  });

  return (
    <Screen>
      <SectionCard title="Conversion history" subtitle="Review every completed or failed job, then open, share, or delete files.">
        <View style={styles.filterRow}>
          {FILTERS.map(value => {
            const active = value === filter;
            return (
              <Text
                key={value}
                onPress={() => dispatch(setHistoryFilter(value))}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    color: active ? '#FFFFFF' : theme.colors.text,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}>
                {value.toUpperCase()}
              </Text>
            );
          })}
        </View>
      </SectionCard>

      {filteredItems.length ? (
        filteredItems.map(item => (
          <SectionCard
            key={item.id}
            title={`${item.outputFormat.toUpperCase()} • ${item.status}`}
            subtitle={`${item.sourceFiles.length} source file(s) • ${formatDate(item.finishedAt || item.createdAt)}`}>
            {item.outputFiles[0]?.thumbnailUri ? (
              <FastImage source={{uri: item.outputFiles[0].thumbnailUri}} style={styles.preview} />
            ) : null}
            <View style={styles.actions}>
              {item.outputFiles[0] ? (
                <>
                  <PrimaryButton label="Open file" onPress={() => openFile(item.outputFiles[0].uri)} />
                  <PrimaryButton label="Share" onPress={() => shareFile(item.outputFiles[0].uri, item.outputFiles[0].name)} secondary />
                </>
              ) : null}
              <PrimaryButton
                label="View result"
                onPress={() =>
                  navigation.getParent()?.navigate('ConversionResult', {
                    historyId: item.id,
                  })
                }
                secondary
              />
            </View>
            <Pressable
              onPress={() => {
                Alert.alert('Delete history item', 'Remove this conversion from history?', [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      const nextItems = items.filter(entry => entry.id !== item.id);
                      dispatch(deleteHistoryItem(item.id));
                      saveHistory(nextItems).catch(() => null);
                    },
                  },
                ]);
            }}
            style={styles.deleteRow}>
              <SymbolIcon name="trash-2" size={16} color={theme.colors.danger} />
              <Text style={[styles.deleteText, {color: theme.colors.danger}]}>Delete from history</Text>
            </Pressable>
          </SectionCard>
        ))
      ) : (
        <SectionCard title="Nothing here yet">
          <Text style={{color: theme.colors.textMuted}}>Your conversion history is empty.</Text>
        </SectionCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    fontWeight: '700',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 14,
  },
  actions: {
    gap: 10,
  },
  deleteRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteText: {
    fontWeight: '700',
  },
});
