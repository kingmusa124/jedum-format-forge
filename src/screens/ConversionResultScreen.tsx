import React, {useMemo, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {RootStackParamList} from '@app/navigation/types';
import {Screen} from '@app/components/Screen';
import {SectionCard} from '@app/components/SectionCard';
import {PrimaryButton} from '@app/components/PrimaryButton';
import {useAppSelector} from '@app/store/hooks';
import {openFile, saveFileToDevice, saveFilesAsZipToDevice, shareFile} from '@app/services/storageService';
import {useAppTheme} from '@app/theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversionResult'>;

export function ConversionResultScreen({route}: Props) {
  const {theme} = useAppTheme();
  const item = useAppSelector(state => state.history.items.find(entry => entry.id === route.params.historyId));
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  const leadPreview = useMemo(() => {
    const first = item?.outputFiles[0];
    if (!first) {
      return null;
    }

    if (first.thumbnailUri) {
      return normalizePreviewUri(first.thumbnailUri);
    }

    return first.type.startsWith('image/') ? normalizePreviewUri(first.uri) : null;
  }, [item]);

  const handleAction = async (label: string, action: () => Promise<void>) => {
    try {
      setBusyLabel(label);
      await action();
    } catch (error) {
      Alert.alert(
        'Action failed',
        error instanceof Error ? error.message : 'Something went wrong while handling this file.',
      );
    } finally {
      setBusyLabel(null);
    }
  };

  const canZipOutputs =
    item?.converterId === 'pdf-to-images' &&
    (item.outputFiles.length ?? 0) > 1 &&
    item.outputFiles.every(file => file.type.startsWith('image/'));

  const zipName = useMemo(() => {
    if (!item?.outputFiles.length) {
      return 'converted-images.zip';
    }

    const firstName = item.outputFiles[0].name;
    const baseName = firstName.replace(/-\d+\.[^.]+$/, '').replace(/\.[^.]+$/, '');
    return `${baseName || 'converted-images'}.zip`;
  }, [item]);

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
      <SectionCard title="Conversion result" subtitle={`${item.outputFormat.toUpperCase()} - ${item.status}`}>
        {leadPreview ? (
          <Pressable onPress={() => setPreviewUri(leadPreview)}>
            <FastImage source={{uri: leadPreview}} style={styles.preview} />
          </Pressable>
        ) : null}

        {canZipOutputs ? (
          <View style={styles.bundleAction}>
            <PrimaryButton
              label="Save all as ZIP"
              onPress={() => {
                void handleAction('Preparing ZIP archive', () =>
                  saveFilesAsZipToDevice(item.outputFiles, zipName),
                );
              }}
              secondary
            />
          </View>
        ) : null}

        <Text style={[styles.label, {color: theme.colors.text}]}>Output files</Text>
        {item.outputFiles.map(file => {
          const imagePreviewUri = file.type.startsWith('image/')
            ? normalizePreviewUri(file.thumbnailUri || file.uri)
            : null;

          return (
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
                {imagePreviewUri ? (
                  <PrimaryButton label="Preview" onPress={() => setPreviewUri(imagePreviewUri)} secondary />
                ) : (
                  <PrimaryButton
                    label="Open"
                    onPress={() => {
                      void handleAction('Opening file', () => openFile(file.uri));
                    }}
                    secondary
                  />
                )}
                <PrimaryButton
                  label="Save to device"
                  onPress={() => {
                    void handleAction('Saving to device', () => saveFileToDevice(file.uri, file.name));
                  }}
                  secondary
                />
                <PrimaryButton
                  label="Share"
                  onPress={() => {
                    void handleAction('Preparing share', () => shareFile(file.uri, file.name));
                  }}
                />
              </View>
            </View>
          );
        })}
      </SectionCard>

      <Modal visible={Boolean(busyLabel)} transparent animationType="fade">
        <View style={styles.progressBackdrop}>
          <View style={[styles.progressCard, {backgroundColor: theme.colors.card, borderColor: theme.colors.border}]}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={[styles.progressTitle, {color: theme.colors.text}]}>{busyLabel}</Text>
            <Text style={[styles.progressText, {color: theme.colors.textMuted}]}>
              Large image bundles can take a few seconds on device.
            </Text>
          </View>
        </View>
      </Modal>

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

function normalizePreviewUri(uri: string) {
  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
    return uri;
  }

  return `file://${uri}`;
}

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    height: 226,
    borderRadius: 22,
    marginBottom: 16,
  },
  label: {
    fontWeight: '700',
    marginBottom: 10,
  },
  bundleAction: {
    marginBottom: 14,
  },
  fileRow: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  fileName: {
    fontWeight: '800',
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
  progressBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 14, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  progressCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderWidth: 1,
    alignItems: 'center',
  },
  progressTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
