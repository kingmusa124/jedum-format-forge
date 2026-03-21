import {NativeModules} from 'react-native';

type PdfToImageModule = {
  convert?: (inputPath: string) => Promise<{outputFiles?: string[]}>;
};

type WebpModule = {
  imageToWebP?: (inputPath: string, outputPath: string, quality: number) => Promise<string>;
};

export const PdfToImageNative: PdfToImageModule = NativeModules.PdfToImage || {};
export const WebpConverterNative: WebpModule = NativeModules.ReactNativeWebpConverter || {};

export function getNativeConversionSupport() {
  return {
    pdfToImage: typeof PdfToImageNative.convert === 'function',
    webpConverter: typeof WebpConverterNative.imageToWebP === 'function',
  };
}
