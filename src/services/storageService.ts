import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Linking, Platform, Share} from 'react-native';
import {FileSystem} from 'react-native-file-access';
import RNFS from 'react-native-fs';
import ShareMenu from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import {ConversionHistoryItem} from '@app/types/files';

const HISTORY_KEY = '@jedum-format-forge/history';
const SETTINGS_KEY = '@jedum-format-forge/settings';

export async function ensureFolder(path: string) {
  const exists = await RNFS.exists(path);
  if (!exists) {
    await RNFS.mkdir(path);
  }
  return path;
}

export function resolveOutputFolder(folder: string) {
  if (folder.startsWith('/')) {
    return folder;
  }
  return `${RNFS.DocumentDirectoryPath}/${folder}`;
}

export async function saveHistory(items: ConversionHistoryItem[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export async function loadHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as ConversionHistoryItem[]) : [];
}

export async function saveSettings(settings: unknown) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadSettings<T>() {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function deleteFileIfExists(path: string) {
  const exists = await RNFS.exists(path);
  if (exists) {
    await RNFS.unlink(path);
  }
}

export async function openFile(path: string) {
  const url = path.startsWith('file://') ? path : `file://${path}`;

  if (Platform.OS === 'android') {
    try {
      await RNFetchBlob.android.actionViewIntent(path.replace('file://', ''), getMimeType(path));
      return;
    } catch {
      // Fall through to generic handling below.
    }
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // Fall through to alert below.
  }

  Alert.alert('Unable to open file', 'No app is available to open this file on this device.');
}

export async function shareFile(path: string, title: string) {
  const url = await createShareableUrl(path, title);

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    try {
      await ShareMenu.open({
        url,
        type: getMimeType(path),
        failOnCancel: false,
        filename: title,
        useInternalStorage: false,
      } as never);
      return;
    } catch (error) {
      if (isShareCancellation(error)) {
        return;
      }

      throw new Error(
        error instanceof Error
          ? `Unable to share ${title}. ${error.message}`
          : `Unable to share ${title} on this device.`,
      );
    }
  }

  try {
    await Share.share({
      title,
      url,
      message: title,
    });
  } catch (error) {
    if (isShareCancellation(error)) {
      return;
    }
    throw error;
  }
}

export async function saveFileToDevice(path: string, title: string) {
  const normalizedPath = path.replace('file://', '');

  if (Platform.OS === 'android') {
    try {
      await FileSystem.cpExternal(normalizedPath, buildSafeFileName(title), getExternalDir(path));
      Alert.alert('Saved', `Saved to your device ${getExternalDir(path) === 'images' ? 'gallery/files' : 'downloads'}.`);
      return;
    } catch (error) {
      const fallbackName = `${Date.now()}-${buildSafeFileName(title)}`;
      try {
        await FileSystem.cpExternal(normalizedPath, fallbackName, getExternalDir(path));
        Alert.alert('Saved', `Saved to your device ${getExternalDir(path) === 'images' ? 'gallery/files' : 'downloads'}.`);
        return;
      } catch (fallbackError) {
        Alert.alert(
          'Save failed',
          fallbackError instanceof Error ? fallbackError.message : 'Unable to save this file to the device.',
        );
        return;
      }
    }
  }

  try {
    await ShareMenu.open({
      title,
      url: path.startsWith('file://') ? path : `file://${path}`,
      type: getMimeType(path),
      failOnCancel: false,
      saveToFiles: true,
      filename: title,
    } as never);
  } catch (error) {
    if (isShareCancellation(error)) {
      return;
    }

    Alert.alert(
      'Save failed',
      error instanceof Error ? error.message : 'Unable to save this file to the device.',
    );
  }
}

export async function getStorageSummary() {
  const freeSpace = await RNFS.getFSInfo();
  return {
    freeSpace: freeSpace.freeSpace,
    totalSpace: freeSpace.totalSpace,
  };
}

export function defaultOutputFolder() {
  return `${RNFS.DocumentDirectoryPath}/JedumFormatForge`;
}

function getMimeType(path: string) {
  const normalized = path.toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  if (normalized.endsWith('.webp')) return 'image/webp';
  if (normalized.endsWith('.pdf')) return 'application/pdf';
  if (normalized.endsWith('.txt')) return 'text/plain';
  if (normalized.endsWith('.csv')) return 'text/csv';
  if (normalized.endsWith('.html') || normalized.endsWith('.htm')) return 'text/html';
  if (normalized.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (normalized.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (normalized.endsWith('.pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  return '*/*';
}

function getExternalDir(path: string): 'audio' | 'downloads' | 'images' | 'video' {
  const mimeType = getMimeType(path);

  if (mimeType.startsWith('image/')) {
    return 'images';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  return 'downloads';
}

function isShareCancellation(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('cancel') || message.includes('dismiss');
}

async function createShareableUrl(path: string, title: string) {
  const normalizedPath = path.replace('file://', '');
  const shareDir = `${RNFS.CachesDirectoryPath}/share`;

  await ensureFolder(shareDir);

  const targetPath = `${shareDir}/${buildSafeFileName(title)}`;
  const exists = await RNFS.exists(targetPath);
  if (!exists) {
    await RNFS.copyFile(normalizedPath, targetPath);
  }

  return `file://${targetPath}`;
}

function buildSafeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]/g, '-');
}
