import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from 'jszip';
import {Alert, Linking, Platform, Share} from 'react-native';
import RNFS from 'react-native-fs';
import ShareMenu from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import {ConversionHistoryItem, ConversionResultFile} from '@app/types/files';

const HISTORY_KEY = '@jedum-format-forge/history';
const SETTINGS_KEY = '@jedum-format-forge/settings';
const INSTALLATION_ID_KEY = '@jedum-format-forge/installation-id';

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

export async function getInstallationId() {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) {
    return existing;
  }

  const created = `jff-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, created);
  return created;
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
  const safeName = buildSafeFileName(title);

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    try {
      await ShareMenu.open({
        url,
        type: getMimeType(path),
        failOnCancel: false,
        filename: safeName,
        useInternalStorage: true,
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
  const safeName = buildSafeFileName(title);
  const mimeType = getMimeType(path);

  if (Platform.OS === 'android') {
    const normalizedSourcePath = path.replace('file://', '');

    try {
      const targetPath = await copyFileToAndroidSaveLocation(normalizedSourcePath, safeName, mimeType);
      Alert.alert('Saved', `Saved to ${targetPath}`, [
        {text: 'Done'},
        {
          text: 'Open',
          onPress: () => {
            void openFile(targetPath);
          },
        },
      ]);
      return;
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Unable to save this file to the device.',
      );
      return;
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

export async function saveFilesAsZipToDevice(
  files: Pick<ConversionResultFile, 'uri' | 'name' | 'type'>[],
  zipName: string,
) {
  if (!files.length) {
    throw new Error('There are no files available to archive.');
  }

  const safeZipName = buildSafeFileName(zipName.endsWith('.zip') ? zipName : `${zipName}.zip`);
  const tempZipPath = `${RNFS.CachesDirectoryPath}/${safeZipName}`;
  const archive = new JSZip();

  for (const file of files) {
    const normalizedPath = file.uri.replace('file://', '');
    const base64 = await RNFS.readFile(normalizedPath, 'base64');
    archive.file(buildSafeFileName(file.name), base64, {base64: true});
  }

  const zipBase64 = await archive.generateAsync({
    type: 'base64',
    compression: 'STORE',
  });

  await deleteFileIfExists(tempZipPath);
  await RNFS.writeFile(tempZipPath, zipBase64, 'base64');

  if (Platform.OS === 'android') {
    try {
      const targetPath = await copyFileToAndroidSaveLocation(
        tempZipPath,
        safeZipName,
        'application/zip',
      );
      Alert.alert('Saved as ZIP', `Saved to ${targetPath}`, [
        {text: 'Done'},
        {
          text: 'Open',
          onPress: () => {
            void openFile(targetPath);
          },
        },
      ]);
      return;
    } catch (error) {
      Alert.alert(
        'ZIP save failed',
        error instanceof Error ? error.message : 'Unable to save this ZIP archive to the device.',
      );
      return;
    }
  }

  await saveFileToDevice(tempZipPath, safeZipName);
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
  if (exists) {
    await RNFS.unlink(targetPath);
  }
  await RNFS.copyFile(normalizedPath, targetPath);

  return `file://${targetPath}`;
}

function buildSafeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]/g, '-');
}

async function resolveAndroidSaveDirectory() {
  const candidates = [
    RNFS.DownloadDirectoryPath ? `${RNFS.DownloadDirectoryPath}/JedumFormatForge` : '',
    RNFS.ExternalDirectoryPath ? `${RNFS.ExternalDirectoryPath}/JedumFormatForge` : '',
    `${RNFS.DocumentDirectoryPath}/Exports`,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await ensureFolder(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error('Unable to find a writable directory on this device.');
}

async function copyFileToAndroidSaveLocation(
  normalizedSourcePath: string,
  safeName: string,
  mimeType: string,
) {
  const targetDirectory = await resolveAndroidSaveDirectory();
  await ensureFolder(targetDirectory);

  const targetPath = `${targetDirectory}/${safeName}`;
  const existing = await RNFS.exists(targetPath);
  if (existing) {
    await RNFS.unlink(targetPath);
  }

  await RNFS.copyFile(normalizedSourcePath, targetPath);

  if (mimeType.startsWith('image/')) {
    void RNFetchBlob.fs.scanFile([{path: targetPath, mime: mimeType}]).catch(() => {
      // Some Android builds fail to scan copied files even though the save succeeded.
    });
  }

  return targetPath;
}
