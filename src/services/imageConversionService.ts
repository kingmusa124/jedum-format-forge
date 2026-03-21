import ImageResizer from 'react-native-image-resizer';
import heicConverter from 'react-native-heic-converter';
import RNFS from 'react-native-fs';

export async function convertImageFormat(
  inputPath: string,
  format: 'PNG' | 'JPEG',
  quality: number,
  outputPath?: string,
) {
  const normalizedInput = inputPath.replace('file://', '');
  const inputExtension = getExtension(normalizedInput);
  const targetExtension = format === 'PNG' ? 'png' : 'jpg';

  if (outputPath && isSameFormat(inputExtension, format)) {
    await RNFS.copyFile(normalizedInput, outputPath);
    return outputPath;
  }

  try {
    const resized = await ImageResizer.createResizedImage(
      normalizedInput,
      1600,
      1600,
      format,
      quality,
      0,
      outputPath,
      false,
    );
    return resized.uri;
  } catch (error) {
    if (outputPath && isSameFormat(inputExtension, format)) {
      await RNFS.copyFile(normalizedInput, outputPath);
      return outputPath;
    }

    throw new Error(
      error instanceof Error
        ? `Image conversion failed for .${inputExtension || targetExtension} input: ${error.message}`
        : `Image conversion is unavailable for this .${inputExtension || targetExtension} file.`,
    );
  }
}

export async function convertHeic(inputPath: string, format: 'JPEG' | 'PNG', quality: number) {
  const result = await heicConverter.convert({
    path: inputPath,
    format,
    quality: quality / 100,
  });
  return result.path;
}

function getExtension(path: string) {
  const cleanPath = path.split('?')[0];
  const parts = cleanPath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function isSameFormat(extension: string, format: 'PNG' | 'JPEG') {
  if (format === 'PNG') {
    return extension === 'png';
  }

  return extension === 'jpg' || extension === 'jpeg';
}
