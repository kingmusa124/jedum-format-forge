import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Alert, StyleSheet, Text, View} from 'react-native';
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
        {item.outputFiles[0]?.thumbnailUri ? (
          <FastImage source={{uri: item.outputFiles[0].thumbnailUri}} style={styles.preview} />
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
              <PrimaryButton
                label="Open"
                onPress={() => {
                  void handleAction(() => openFile(file.uri));
                }}
                secondary
              />
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
});
