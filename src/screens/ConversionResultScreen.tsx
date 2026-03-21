import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Alert, Image, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {RootStackParamList} from '@app/navigation/types';
import {Screen} from '@app/components/Screen';
import {SectionCard} from '@app/components/SectionCard';
import {PrimaryButton} from '@app/components/PrimaryButton';
import {useAppSelector} from '@app/store/hooks';
import {openFile, saveFileToDevice, shareFile} from '@app/services/storageService';
import {useAppTheme} from '@app/theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversionResult'>;

export function ConversionResultScreen({route}: Props) {
  const {theme} = useAppTheme();
  const item = useAppSelector(state => state.history.items.find(entry => entry.id === route.params.historyId));
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const leadPreview = useMemo(() => {
    const first = item?.outputFiles[0];
    if (!first) {
      return null;
    }

    if (first.thumbnailUri) {
      return first.thumbnailUri;
    }

    return first.type.startsWith('image/') ? first.uri : null;
  }, [item]);

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      Alert.alert(
        'Action failed',
        error instanceof Error ? error.message : 'Something went wrong while handling this file.',
      );
    }
  };

  if (!item) {
    return (
      <Screen>
        <SectionCard title="Result unavailable">
          <Text style={{color: theme.colors.textMuted}}>This conversion could not be found in history.</Text>
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionCard title="Conversion result" subtitle={`${item.outputFormat.toUpperCase()} • ${item.status}`}>
        {leadPreview ? (
          <Pressable onPress={() => setPreviewUri(leadPreview)}>
            <FastImage source={{uri: leadPreview}} style={styles.preview} />
          </Pressable>
        ) : null}
        <Text style={[styles.label, {color: theme.colors.text}]}>Output files</Text>
        {item.outputFiles.map(file => (
          <View
            key={file.id}
            style={[
              styles.fileRow,
              {borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
            ]}>
            <View style={{flex: 1}}>
              <Text style={[styles.fileName, {color: theme.colors.text}]}>{file.name}</Text>
              <Text style={[styles.fileType, {color: theme.colors.textMuted}]}>{file.type}</Text>
            </View>
            <View style={styles.actions}>
              {file.type.startsWith('image/') ? (
                <PrimaryButton
                  label="Preview"
                  onPress={() => {
                    setPreviewUri(file.thumbnailUri || file.uri);
                  }}
                  secondary
                />
              ) : (
                <PrimaryButton
                  label="Open"
                  onPress={() => {
                    void handleAction(() => openFile(file.uri));
                  }}
                  secondary
                />
              )}
              <PrimaryButton
                label="Save to device"
                onPress={() => {
                  void handleAction(() => saveFileToDevice(file.uri, file.name));
                }}
                secondary
              />
              <PrimaryButton
                label="Share"
                onPress={() => {
                  void handleAction(() => shareFile(file.uri, file.name));
                }}
              />
            </View>
          </View>
        ))}
      </SectionCard>
      <Modal visible={Boolean(previewUri)} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalClose} onPress={() => setPreviewUri(null)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
          {previewUri ? <Image source={{uri: previewUri}} style={styles.modalImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 16,
  },
  label: {
    fontWeight: '700',
    marginBottom: 10,
  },
  fileRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  fileName: {
    fontWeight: '700',
  },
  fileType: {
    marginTop: 4,
    fontSize: 12,
  },
  actions: {
    marginTop: 12,
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 14, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalImage: {
    width: '100%',
    height: '82%',
  },
});
