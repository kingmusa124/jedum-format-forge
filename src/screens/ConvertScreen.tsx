import React, {useMemo, useRef} from 'react';
import {Alert, Pressable, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabParamList} from '@app/navigation/types';
import {converters, getConverterById, getConvertersByCategory} from '@app/converters';
import {FileCard} from '@app/components/FileCard';
import {PrimaryButton} from '@app/components/PrimaryButton';
import {ProgressCard} from '@app/components/ProgressCard';
import {Screen} from '@app/components/Screen';
import {SectionCard} from '@app/components/SectionCard';
import {useAppDispatch, useAppSelector} from '@app/store/hooks';
import {
  addToQueue,
  beginConversion,
  cancelConversion,
  clearQueue,
  finishConversion,
  removeFromQueue,
  resetProgress,
  setCustomFileName,
  setMergeIntoSinglePdf,
  setMergePdfs,
  setProgress,
  setSelectedCategory,
  setSelectedConverterId,
  setSelectedOutputFormat,
  setServerApiKey,
  setServerUrl,
} from '@app/store/slices/conversionSlice';
import {addHistoryItem, updateHistoryItem} from '@app/store/slices/historySlice';
import {captureImage, pickFiles} from '@app/services/filePickerService';
import {
  ensureCameraPermission,
  ensureFilePickerPermission,
} from '@app/services/permissionsService';
import {convertFiles} from '@app/services/conversionService';
import {getNativeConversionSupport} from '@app/services/nativeModules';
import {saveHistory} from '@app/services/storageService';
import {useAppTheme} from '@app/theme/ThemeProvider';
import {ConversionCategory, ConversionHistoryItem} from '@app/types/files';

type Props = BottomTabScreenProps<TabParamList, 'Convert'>;

const CATEGORIES: {key: ConversionCategory; label: string}[] = [
  {key: 'images', label: 'Images'},
  {key: 'documents', label: 'Documents'},
  {key: 'sheets', label: 'Sheets'},
  {key: 'slides', label: 'Slides'},
];

function isIntentCancellation(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('cancel') || message.includes('dismiss');
}

export function ConvertScreen({navigation}: Props) {
  const dispatch = useAppDispatch();
  const {theme} = useAppTheme();
  const conversion = useAppSelector(state => state.conversion);
  const historyItems = useAppSelector(state => state.history.items);
  const settings = useAppSelector(state => state.settings);
  const cancelRef = useRef(false);

  const categoryConverters = useMemo(
    () => getConvertersByCategory(conversion.selectedCategory),
    [conversion.selectedCategory],
  );
  const selectedConverter = getConverterById(conversion.selectedConverterId) || categoryConverters[0] || converters[0];
  const canConvert = conversion.queue.length > 0 && !conversion.isConverting;
  const nativeSupport = getNativeConversionSupport();
  const isNativeRequirementMissing =
    !!selectedConverter.requiresNativeModule &&
    !nativeSupport[selectedConverter.requiresNativeModule];

  const compatibleFiles = conversion.queue.filter(file =>
    selectedConverter.inputExtensions.includes(file.extension as never),
  );

  const refreshPersistedHistory = (items: ConversionHistoryItem[]) => {
    saveHistory(items).catch(() => null);
  };

  const resetSelectionWorkspace = () => {
    dispatch(clearQueue());
    dispatch(resetProgress());
    dispatch(setCustomFileName(''));
  };

  const handlePickFiles = async () => {
    try {
      const granted = await ensureFilePickerPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'File access permission is required to pick files.');
        return;
      }
      const files = await pickFiles(conversion.selectedCategory, selectedConverter.inputExtensions);
      if (!files.length) {
        Alert.alert(
          'No matching files found',
          `Pick files with one of these formats: ${selectedConverter.inputExtensions.join(', ').toUpperCase()}.`,
        );
        return;
      }
      dispatch(addToQueue(files));
    } catch (error) {
      if (isIntentCancellation(error)) {
        return;
      }

      Alert.alert(
        'Unable to pick files',
        error instanceof Error ? error.message : 'Something went wrong while opening the picker.',
      );
    }
  };

  const handleCapture = async () => {
    try {
      const granted = await ensureCameraPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to capture a photo.');
        return;
      }
      const captured = await captureImage();
      if (captured) {
        dispatch(addToQueue([captured]));
      }
    } catch (error) {
      if (isIntentCancellation(error)) {
        return;
      }

      Alert.alert(
        'Unable to capture photo',
        error instanceof Error ? error.message : 'Something went wrong while opening the camera.',
      );
    }
  };

  const handleCategoryChange = (category: ConversionCategory) => {
    if (conversion.isConverting) {
      Alert.alert('Finish this job first', 'Cancel the current conversion before changing workflow.');
      return;
    }

    if (category !== conversion.selectedCategory) {
      resetSelectionWorkspace();
    }
    dispatch(setSelectedCategory(category));
    const first = getConvertersByCategory(category)[0];
    if (first) {
      dispatch(setSelectedConverterId(first.id));
      dispatch(setSelectedOutputFormat(first.outputFormat));
    }
  };

  const handleConverterChange = (converterId: string) => {
    const converter = getConverterById(converterId);
    if (!converter) {
      return;
    }

    if (conversion.isConverting) {
      Alert.alert('Finish this job first', 'Cancel the current conversion before changing workflow.');
      return;
    }

    if (converter.id !== selectedConverter.id) {
      resetSelectionWorkspace();
    }
    dispatch(setSelectedConverterId(converter.id));
    dispatch(setSelectedOutputFormat(converter.outputFormat));
  };

  const handleConvert = async () => {
    if (compatibleFiles.length === 0) {
      Alert.alert('No compatible files', 'The selected converter does not match the files currently in queue.');
      return;
    }
    if (selectedConverter.requiresServer && !conversion.serverUrl.trim()) {
      Alert.alert('Server URL required', 'Enter your HTTPS conversion server URL for this cloud workflow.');
      return;
    }
    if (isNativeRequirementMissing) {
      Alert.alert(
        'Converter unavailable on this build',
        'This conversion depends on a native module that is not active in the current app build.',
      );
      return;
    }

    const jobId = `job-${Date.now()}`;
    cancelRef.current = false;

    const historyDraft: ConversionHistoryItem = {
      id: jobId,
      sourceFiles: compatibleFiles,
      outputFiles: [],
      outputFormat: selectedConverter.outputFormat,
      converterId: selectedConverter.id,
      category: selectedConverter.category,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [historyDraft, ...historyItems];
    dispatch(addHistoryItem(historyDraft));
    refreshPersistedHistory(nextHistory);
    dispatch(beginConversion(jobId));

    try {
      const outputFiles = await convertFiles(
        compatibleFiles,
        {
          converterId: selectedConverter.id,
          category: selectedConverter.category,
          outputFormat: selectedConverter.outputFormat,
          quality: conversion.quality,
          compression: conversion.compression,
          mergeIntoSinglePdf: conversion.mergeIntoSinglePdf,
          mergePdfs: conversion.mergePdfs,
          outputFolder: conversion.outputFolder,
          customFileName: conversion.customFileName,
          serverUrl: conversion.serverUrl,
          serverApiKey: conversion.serverApiKey,
        },
        progress => dispatch(setProgress(progress)),
        () => cancelRef.current,
      );

      const completed: ConversionHistoryItem = {
        ...historyDraft,
        outputFiles,
        status: cancelRef.current ? 'cancelled' : 'success',
        finishedAt: new Date().toISOString(),
      };

      const updatedItems = nextHistory.map(item => (item.id === completed.id ? completed : item));
      dispatch(updateHistoryItem(completed));
      dispatch(finishConversion());
      refreshPersistedHistory(updatedItems);
      (navigation.getParent() as {navigate: (screen: string, params: {historyId: string}) => void} | undefined)?.navigate(
        'ConversionResult',
        {historyId: completed.id},
      );
    } catch (error) {
      const failed: ConversionHistoryItem = {
        ...historyDraft,
        status: cancelRef.current ? 'cancelled' : 'failed',
        finishedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown conversion error',
      };
      const updatedItems = nextHistory.map(item => (item.id === failed.id ? failed : item));
      dispatch(updateHistoryItem(failed));
      dispatch(cancelConversion());
      refreshPersistedHistory(updatedItems);
      if (!cancelRef.current) {
        Alert.alert('Conversion failed', failed.errorMessage || 'Something went wrong.');
      }
    }
  };

  return (
    <Screen>
      <SectionCard title="Conversion studio" gradient>
        <View style={styles.heroStats}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroValue}>{selectedConverter.name}</Text>
            <Text style={styles.heroLabel}>Active workflow</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroValue}>{compatibleFiles.length}</Text>
            <Text style={styles.heroLabel}>Ready files</Text>
          </View>
        </View>
        <View style={[styles.actions, {marginTop: 18}]}>
          <PrimaryButton
            label={`Pick ${selectedConverter.inputExtensions.join('/').toUpperCase()} files`}
            onPress={handlePickFiles}
          />
          <PrimaryButton label="Capture photo" onPress={handleCapture} secondary />
        </View>
      </SectionCard>

      <SectionCard
        title="Step 1: Files"
        subtitle={conversion.queue.length ? `${conversion.queue.length} file(s) in queue.` : 'Start with a fresh set of files.'}>
        {conversion.queue.length ? (
          <View style={styles.stack}>
            {conversion.queue.map(file => (
              <FileCard key={file.id} file={file} onRemove={id => dispatch(removeFromQueue(id))} />
            ))}
          </View>
        ) : (
          <Text style={[styles.caption, {color: theme.colors.textMuted}]}>No files selected yet.</Text>
        )}
      </SectionCard>

      <SectionCard title="Step 2: Conversion type">
        <View style={styles.optionRow}>
          {CATEGORIES.map(category => {
            const active = category.key === conversion.selectedCategory;
            return (
              <Pressable
                key={category.key}
                onPress={() => handleCategoryChange(category.key)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}>
                <Text style={{color: active ? '#FFFFFF' : theme.colors.text, fontWeight: '700'}}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.stack}>
          {categoryConverters.map(converter => {
            const active = converter.id === selectedConverter.id;
            return (
              <Pressable
                key={converter.id}
                onPress={() => handleConverterChange(converter.id)}
                style={[
                  styles.converterCard,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}>
                <Text
                  style={[styles.converterTitle, {color: active ? '#FFFFFF' : theme.colors.text}]}>
                  {converter.name}
                </Text>
                <View style={styles.badgeRow}>
                  <Text style={[styles.badge, styles.formatBadge]}>
                    {converter.inputExtensions.join(', ').toUpperCase()}
                  </Text>
                  {converter.requiresServer ? (
                    <Text style={[styles.badge, styles.cloudBadge]}>Cloud Required</Text>
                  ) : (
                    <Text style={[styles.badge, styles.offlineBadge]}>Offline</Text>
                  )}
                  {converter.requiresNativeModule && !nativeSupport[converter.requiresNativeModule] ? (
                    <Text style={[styles.badge, styles.warningBadge]}>Native Module Missing</Text>
                  ) : null}
                  {!converter.supportsBatch ? <Text style={[styles.badge, styles.infoBadge]}>Single File</Text> : null}
                  {converter.previewUnavailable ? <Text style={[styles.badge, styles.infoBadge]}>Preview Limited</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="Step 3: Output setup" subtitle={`Selected: ${selectedConverter.name}.`}>
        <View style={styles.stack}>
          {selectedConverter.requiresServer ? (
            <View style={[styles.serverNotice, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
              <Text style={[styles.serverTitle, {color: theme.colors.text}]}>Cloud conversion requires your own backend</Text>
              <Text style={[styles.serverText, {color: theme.colors.textMuted}]}>
                This app does not ship with a hosted backend. Use your own HTTPS conversion API and only send files to a server you trust.
              </Text>
            </View>
          ) : null}
          {isNativeRequirementMissing ? (
            <View style={[styles.serverNotice, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
              <Text style={[styles.serverTitle, {color: theme.colors.text}]}>This converter is unavailable in the current Android build</Text>
              <Text style={[styles.serverText, {color: theme.colors.textMuted}]}>
                Pick another converter for now, or rebuild after the missing native dependency is fully integrated.
              </Text>
            </View>
          ) : null}

          <View style={[styles.noteCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            <Text style={[styles.noteTitle, {color: theme.colors.text}]}>Defaults live in Settings</Text>
            <Text style={[styles.noteText, {color: theme.colors.textMuted}]}>
              Output folder: {settings.defaultOutputFolder}
              {'\n'}
              Adjust image quality, PDF layout, storage, cloud, and ads from Settings.
            </Text>
          </View>
          <View>
            <Text style={[styles.label, {color: theme.colors.text}]}>Custom output name</Text>
            <TextInput
              value={conversion.customFileName}
              onChangeText={text => dispatch(setCustomFileName(text))}
              placeholder="Optional"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, {backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border}]}
            />
          </View>
          {selectedConverter.requiresServer ? (
            <View>
              <Text style={[styles.label, {color: theme.colors.text}]}>Server URL</Text>
              <TextInput
                value={conversion.serverUrl}
                onChangeText={text => dispatch(setServerUrl(text))}
                placeholder="https://your-server.example.com/convert"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                style={[styles.input, {backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border}]}
              />
            </View>
          ) : null}
          {selectedConverter.requiresServer ? (
            <View>
              <Text style={[styles.label, {color: theme.colors.text}]}>Backend API key</Text>
              <TextInput
                value={conversion.serverApiKey}
                onChangeText={text => dispatch(setServerApiKey(text))}
                placeholder="Paste the x-api-key for your backend"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                style={[styles.input, {backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border}]}
              />
            </View>
          ) : null}
          {selectedConverter.id === 'images-to-pdf' ? (
            <View style={[styles.toggleCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
              <View style={{flex: 1}}>
                <Text style={[styles.label, {color: theme.colors.text}]}>Merge images into a single PDF</Text>
                <Text style={[styles.toggleHint, {color: theme.colors.textMuted}]}>Turn this off to export one PDF per image instead.</Text>
              </View>
              <Switch
                value={conversion.mergeIntoSinglePdf}
                onValueChange={value => {
                  dispatch(setMergeIntoSinglePdf(value));
                }}
                trackColor={{true: theme.colors.primary, false: theme.colors.border}}
                thumbColor="#FFFFFF"
              />
            </View>
          ) : null}
          {selectedConverter.id === 'merge-pdfs' ? (
            <View style={[styles.toggleCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
              <View style={{flex: 1}}>
                <Text style={[styles.label, {color: theme.colors.text}]}>Merge PDFs into one file</Text>
                <Text style={[styles.toggleHint, {color: theme.colors.textMuted}]}>Combine every selected PDF into a single merged document.</Text>
              </View>
              <Switch
                value={conversion.mergePdfs}
                onValueChange={value => {
                  dispatch(setMergePdfs(value));
                }}
                trackColor={{true: theme.colors.primary, false: theme.colors.border}}
                thumbColor="#FFFFFF"
              />
            </View>
          ) : null}
        </View>
      </SectionCard>

      {conversion.isConverting ? <ProgressCard progress={conversion.progress} /> : null}

      <SectionCard title="Step 4: Convert" subtitle="Run the workflow or reset the current workspace.">
        <View style={styles.actions}>
          <PrimaryButton label="Convert now" onPress={handleConvert} disabled={!canConvert} loading={conversion.isConverting} />
          <PrimaryButton
            label="Cancel job"
            onPress={() => {
              cancelRef.current = true;
              dispatch(cancelConversion());
            }}
            secondary
            disabled={!conversion.isConverting}
          />
          <PrimaryButton
            label="Clear queue"
            onPress={() => {
              dispatch(clearQueue());
              dispatch(resetProgress());
            }}
            secondary
          />
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {gap: 12},
  stack: {gap: 12},
  caption: {fontSize: 14},
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    fontSize: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 96,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  noteTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
  },
  converterCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 10,
  },
  converterTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cloudBadge: {
    backgroundColor: '#2E5BFF',
  },
  offlineBadge: {
    backgroundColor: '#00C48C',
  },
  infoBadge: {
    backgroundColor: '#6B7A90',
  },
  formatBadge: {
    backgroundColor: '#344054',
  },
  warningBadge: {
    backgroundColor: '#E67E22',
  },
  serverNotice: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  serverTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  serverText: {
    lineHeight: 20,
  },
  toggleCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
