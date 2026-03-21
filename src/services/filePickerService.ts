import DocumentPicker from 'react-native-document-picker';
import type {DocumentPickerResponse} from 'react-native-document-picker';
import PdfThumbnail from 'react-native-pdf-thumbnail';
import {launchCamera} from 'react-native-image-picker';
import {Platform} from 'react-native';
import {ConversionCategory, PickedFile, SupportedInputType} from '@app/types/files';
import {getExtension} from '@app/utils/fileName';

function normalizeFile(file: DocumentPickerResponse): PickedFile {
  const preferredUri = file.fileCopyUri || file.uri;
  const preferredName =
    file.name ||
    preferredUri.split('/').pop()?.split('?')[0] ||
    `file-${Date.now()}`;

  return {
    id: `${preferredName || 'file'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: preferredUri,
    name: preferredName,
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    modifiedAt: Date.now(),
    extension: getExtension(preferredName),
  };
}

async function attachThumbnail(file: PickedFile) {
  if (file.extension === 'pdf') {
    try {
      const thumb = await PdfThumbnail.generate(file.uri, 0);
      return {...file, thumbnailUri: thumb.uri};
    } catch {
      return file;
    }
  }

  if (['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'heic'].includes(file.extension)) {
    return {...file, thumbnailUri: file.uri};
  }

  return file;
}

function allowedExtensionsForCategory(category: ConversionCategory) {
  switch (category) {
    case 'images':
      return ['png', 'jpg', 'jpeg', 'heic'] as SupportedInputType[];
    case 'documents':
      return ['pdf', 'docx', 'txt', 'html', 'htm', 'md', 'markdown'] as SupportedInputType[];
    case 'sheets':
      return ['xls', 'xlsx', 'csv'] as SupportedInputType[];
    case 'slides':
      return ['ppt', 'pptx'] as SupportedInputType[];
    default:
      return [];
  }
}

export async function pickFiles(category: ConversionCategory, allowedExtensions?: SupportedInputType[]) {
  const files = await DocumentPicker.pick({
    allowMultiSelection: true,
    copyTo: 'documentDirectory',
    presentationStyle: 'fullScreen',
    type: [DocumentPicker.types.allFiles],
  });

  const targetExtensions = new Set((allowedExtensions?.length ? allowedExtensions : allowedExtensionsForCategory(category)).map(
    extension => extension.toLowerCase(),
  ));

  const normalized = files
    .map(normalizeFile)
    .filter(file => targetExtensions.has(file.extension.toLowerCase()));

  return Promise.all(normalized.map(attachThumbnail));
}

export async function captureImage() {
  const response = await launchCamera({
    mediaType: 'photo',
    includeBase64: false,
    saveToPhotos: true,
    presentationStyle: 'fullScreen',
  });

  const asset = response.assets?.[0];
  if (!asset?.uri) {
    return null;
  }

  return attachThumbnail({
    id: `camera-${Date.now()}`,
    uri: asset.uri,
    name: asset.fileName || `capture-${Date.now()}.jpg`,
    size: asset.fileSize || 0,
    type: asset.type || 'image/jpeg',
    modifiedAt: Date.now(),
    extension: getExtension(asset.fileName || (Platform.OS === 'ios' ? 'capture.jpg' : 'capture.jpg')),
    thumbnailUri: asset.uri,
  });
}
