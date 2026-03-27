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
import {openFile, saveHistory, shareFile} from '@app/services/storageService';
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
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>History</Text>
        <View style={[styles.headerBadge, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <Text style={[styles.headerBadgeText, {color: theme.colors.textMuted}]}>
            {filteredItems.length} saved job{filteredItems.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(value => {
          const active = value === filter;
          return (
            <Pressable
              key={value}
              onPress={() => dispatch(setHistoryFilter(value))}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <Text style={[styles.filterText, {color: active ? '#FFFFFF' : theme.colors.text}]}>
                {value.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filteredItems.length ? (
        filteredItems.map(item => {
          const previewUri = item.outputFiles[0]?.thumbnailUri || item.outputFiles[0]?.uri;
          const normalizedPreview = previewUri ? normalizeImageUri(previewUri) : null;

          return (
            <SectionCard
              key={item.id}
              title={`${item.outputFormat.toUpperCase()} - ${item.status}`}
              subtitle={`${item.sourceFiles.length} source file(s) - ${formatDate(item.finishedAt || item.createdAt)}`}>
              {normalizedPreview && item.outputFiles[0]?.type.startsWith('image/') ? (
                <FastImage source={{uri: normalizedPreview}} style={styles.preview} />
              ) : null}

              <View style={styles.metaRow}>
                <View style={[styles.metaBadge, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
                  <Text style={[styles.metaText, {color: theme.colors.textMuted}]}>
                    {item.outputFiles.length} output file(s)
                  </Text>
                </View>
                <View style={[styles.metaBadge, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
                  <Text style={[styles.metaText, {color: theme.colors.textMuted}]}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                {item.outputFiles[0] ? (
                  <>
                    <PrimaryButton
                      label="Open file"
                      onPress={() => {
                        void openFile(item.outputFiles[0].uri);
                      }}
                    />
                    <PrimaryButton
                      label="Share"
                      onPress={() => {
                        void shareFile(item.outputFiles[0].uri, item.outputFiles[0].name);
                      }}
                      secondary
                    />
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
          );
        })
      ) : (
        <SectionCard title="Nothing here yet">
          <Text style={{color: theme.colors.textMuted}}>Your conversion history is empty.</Text>
        </SectionCard>
      )}
    </Screen>
  );
}

function normalizeImageUri(uri: string) {
  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
    return uri;
  }

  return `file://${uri}`;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 4,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  preview: {
    width: '100%',
    height: 188,
    borderRadius: 20,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
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
