import RNFS from 'react-native-fs';
import {Image} from 'react-native';
import {PDFDocument, PDFPage} from 'react-native-pdf-lib';
import {ConversionProgress, ConversionResultFile, ConversionSettings, PickedFile} from '@app/types/files';
import {buildOutputName, stripExtension} from '@app/utils/fileName';
import {ensureFolder, resolveOutputFolder} from '@app/services/storageService';
import {PdfToImageNative, WebpConverterNative} from '@app/services/nativeModules';
import {htmlLikeToPdf, docxToText} from '@app/services/documentConverter';
import {csvToExcel, excelToCSV, excelToHTML, excelToPDF} from '@app/services/excelConverter';
import {extractPresentationText} from '@app/services/pptConverter';
import {convertWithServer} from '@app/services/serverConversionService';
import {convertHeic, convertImageFormat} from '@app/services/imageConversionService';
import {mergeMultiplePDFs} from '@app/services/pdfToolsService';

type ProgressCallback = (progress: ConversionProgress) => void;
type CancelCallback = () => boolean;
const PDF_PAGE_WIDTH = 595.2;
const PDF_PAGE_HEIGHT = 841.8;
const PDF_PAGE_MARGIN = 28;

export async function convertFiles(
  files: PickedFile[],
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const outputDir = await ensureFolder(resolveOutputFolder(settings.outputFolder));
  const converterId = settings.converterId || inferConverterId(files, settings);

  switch (converterId) {
    case 'images-to-pdf':
      return convertImagesToPdf(files, settings, outputDir, onProgress, shouldCancel);
    case 'images-to-webp':
      return convertImagesToWebp(files, settings, outputDir, onProgress, shouldCancel);
    case 'image-to-jpg':
      return convertImages(files, 'JPEG', 'jpg', settings, outputDir, onProgress, shouldCancel);
    case 'image-to-png':
      return convertImages(files, 'PNG', 'png', settings, outputDir, onProgress, shouldCancel);
    case 'pdf-to-images':
      return convertPdfToImages(files, settings, outputDir, onProgress, shouldCancel);
    case 'merge-pdfs':
      return mergePdfs(files, outputDir, onProgress, shouldCancel);
    case 'word-to-pdf':
      return convertOfficeFilesWithServer(
        files,
        outputDir,
        settings,
        onProgress,
        shouldCancel,
        ['docx'],
        'pdf',
        'application/pdf',
      );
    case 'pdf-to-docx-server':
      return convertPdfToDocxWithServer(files, outputDir, settings, onProgress, shouldCancel);
    case 'docx-to-txt':
      return convertDocxToTxt(files, outputDir, settings, onProgress, shouldCancel);
    case 'txt-to-pdf':
      return convertHtmlLikeFiles(files, outputDir, 'txt', 'application/pdf', settings, onProgress, shouldCancel);
    case 'html-to-pdf':
      return convertHtmlLikeFiles(files, outputDir, 'html', 'application/pdf', settings, onProgress, shouldCancel);
    case 'md-to-pdf':
      return convertHtmlLikeFiles(files, outputDir, 'md', 'application/pdf', settings, onProgress, shouldCancel);
    case 'excel-to-csv':
      return convertExcelFiles(files, outputDir, settings, onProgress, shouldCancel, excelToCSV, 'text/csv', 'csv');
    case 'excel-to-pdf':
      return convertExcelFiles(files, outputDir, settings, onProgress, shouldCancel, excelToPDF, 'application/pdf', 'pdf');
    case 'excel-to-html':
      return convertExcelFiles(files, outputDir, settings, onProgress, shouldCancel, excelToHTML, 'text/html', 'html');
    case 'csv-to-excel':
      return convertCsvFiles(files, outputDir, settings, onProgress, shouldCancel);
    case 'ppt-to-pdf-server':
      return convertPptWithServer(files, outputDir, settings, onProgress, shouldCancel);
    case 'ppt-to-text':
      return convertPptToText(files, outputDir, settings, onProgress, shouldCancel);
    default:
      throw new Error(`Unsupported conversion target for converter ${converterId}.`);
  }
}

function inferConverterId(files: PickedFile[], settings: ConversionSettings) {
  if (settings.outputFormat === 'pdf') {
    return 'images-to-pdf';
  }
  if (settings.outputFormat === 'webp') {
    return 'images-to-webp';
  }
  if (settings.outputFormat === 'png' || settings.outputFormat === 'jpg') {
    return 'pdf-to-images';
  }
  return 'images-to-pdf';
}

async function convertImagesToPdf(
  files: PickedFile[],
  settings: ConversionSettings,
  outputDir: string,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const imageFiles = files.filter(file => ['png', 'jpg', 'jpeg', 'heic', 'bmp', 'gif', 'webp'].includes(file.extension));
  if (!imageFiles.length) {
    throw new Error('Select one or more supported image files to create a PDF.');
  }

  if (!settings.mergeIntoSinglePdf) {
    const results: ConversionResultFile[] = [];

    for (let index = 0; index < imageFiles.length; index += 1) {
      if (shouldCancel()) {
        throw new Error('cancelled');
      }
      const image = imageFiles[index];
      const prepared = await prepareImageForPdf(image, settings.quality);
      const targetName = buildOutputName(image.name, 'pdf', settings.customFileName);
      const outputPath = `${outputDir}/${targetName}`;
      try {
        const document = PDFDocument.create(outputPath).addPages(await createPdfImagePage(prepared.uri, prepared.format));
        await document.write();
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? `Unable to add ${image.name} to the PDF. ${error.message}`
            : `Unable to add ${image.name} to the PDF on this device.`,
        );
      }
      results.push({id: `${image.id}-pdf`, uri: outputPath, name: targetName, type: 'application/pdf'});
      onProgress({
        percent: Math.round(((index + 1) / imageFiles.length) * 100),
        stage: `Exporting ${image.name}`,
        etaSeconds: Math.max(0, imageFiles.length - index - 1) * 2,
      });
    }
    return results;
  }

  const baseName = settings.customFileName?.trim() || `batch-${Date.now()}`;
  const targetName = buildOutputName(baseName, 'pdf');
  const outputPath = `${outputDir}/${targetName}`;
  let document = PDFDocument.create(outputPath);

  for (let index = 0; index < imageFiles.length; index += 1) {
    if (shouldCancel()) {
      throw new Error('cancelled');
    }
    const image = imageFiles[index];
    const prepared = await prepareImageForPdf(image, settings.quality);
    try {
      const page = await createPdfImagePage(prepared.uri, prepared.format);
      document = document.addPages(page);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Unable to add ${image.name} to the PDF. ${error.message}`
          : `Unable to add ${image.name} to the PDF on this device.`,
      );
    }
    onProgress({
      percent: Math.round(((index + 1) / imageFiles.length) * 100),
      stage: `Adding ${image.name}`,
      etaSeconds: Math.max(0, imageFiles.length - index - 1) * 2,
    });
  }

  await document.write();
  return [{id: `out-${Date.now()}`, uri: outputPath, name: targetName, type: 'application/pdf'}];
}

async function convertImagesToWebp(
  files: PickedFile[],
  settings: ConversionSettings,
  outputDir: string,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const imageFiles = files.filter(file => ['png', 'jpg', 'jpeg', 'bmp', 'gif'].includes(file.extension));
  if (!imageFiles.length) {
    throw new Error('Select supported image files for WebP conversion.');
  }

  const results: ConversionResultFile[] = [];
  for (let index = 0; index < imageFiles.length; index += 1) {
    if (shouldCancel()) {
      throw new Error('cancelled');
    }
    const image = imageFiles[index];
    const normalized = await normalizeImageInput(image, settings.quality);
    const targetName = buildOutputName(image.name, 'webp', settings.customFileName);
    const outputPath = `${outputDir}/${targetName}`;

    if (!WebpConverterNative.imageToWebP) {
      await RNFS.copyFile(normalized.uri.replace('file://', ''), outputPath);
    } else {
      await WebpConverterNative.imageToWebP(normalized.uri, outputPath, settings.quality);
    }

    results.push({
      id: `${image.id}-webp`,
      uri: toFileUri(outputPath),
      name: targetName,
      type: 'image/webp',
      thumbnailUri: toFileUri(outputPath),
    });
    onProgress({
      percent: Math.round(((index + 1) / imageFiles.length) * 100),
      stage: `Converting ${image.name}`,
      etaSeconds: Math.max(0, imageFiles.length - index - 1),
    });
  }
  return results;
}

async function convertImages(
  files: PickedFile[],
  targetFormat: 'JPEG' | 'PNG',
  outputExtension: 'jpg' | 'png',
  settings: ConversionSettings,
  outputDir: string,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const imageFiles = files.filter(file =>
    ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'heic', 'webp'].includes(file.extension),
  );
  if (!imageFiles.length) {
    throw new Error('Select supported image files for conversion.');
  }

  const results: ConversionResultFile[] = [];
  for (let index = 0; index < imageFiles.length; index += 1) {
    if (shouldCancel()) {
      throw new Error('cancelled');
    }
    const image = imageFiles[index];
    const sourcePath = await normalizeImageInput(image, settings.quality);
    const outputPath = `${outputDir}/${buildOutputName(image.name, outputExtension, settings.customFileName)}`;
    const uri = await convertImageFormat(sourcePath.uri, targetFormat, settings.quality, outputPath);
    results.push({
      id: `${image.id}-${outputExtension}`,
      uri: toFileUri(uri),
      name: buildOutputName(image.name, outputExtension, settings.customFileName),
      type: `image/${outputExtension}`,
      thumbnailUri: toFileUri(uri),
    });
    onProgress({
      percent: Math.round(((index + 1) / imageFiles.length) * 100),
      stage: `Converting ${image.name}`,
      etaSeconds: Math.max(0, imageFiles.length - index - 1),
    });
  }
  return results;
}

async function convertPdfToImages(
  files: PickedFile[],
  settings: ConversionSettings,
  outputDir: string,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const pdfFiles = files.filter(file => file.extension === 'pdf');
  if (!pdfFiles.length) {
    throw new Error('Select one or more PDF files to convert into images.');
  }

  const format = settings.outputFormat === 'jpg' ? 'jpg' : 'png';
  const results: ConversionResultFile[] = [];

  for (let index = 0; index < pdfFiles.length; index += 1) {
    if (shouldCancel()) {
      throw new Error('cancelled');
    }
    const pdf = pdfFiles[index];
    const pagesDir = `${outputDir}/${stripExtension(pdf.name)}`;
    await ensureFolder(pagesDir);
    const rendered = PdfToImageNative.convert ? await PdfToImageNative.convert(pdf.uri) : {outputFiles: []};
    const paths = rendered.outputFiles || [];
    if (!paths.length) {
      throw new Error('PDF to image conversion is unavailable. Verify the native module integration.');
    }

    for (let pageIndex = 0; pageIndex < paths.length; pageIndex += 1) {
      const path = paths[pageIndex];
      const targetName = `${stripExtension(pdf.name)}-${pageIndex + 1}.${format}`;
      const targetPath = `${pagesDir}/${targetName}`;
      const outputPath =
        format === 'jpg'
          ? await convertImageFormat(path, 'JPEG', settings.quality, targetPath)
          : await copyGeneratedPdfImage(path, targetPath);

      results.push({
        id: `${pdf.id}-${pageIndex}`,
        uri: toFileUri(outputPath),
        name: targetName,
        type: `image/${format}`,
        thumbnailUri: toFileUri(outputPath),
      });
    }
    onProgress({
      percent: Math.round(((index + 1) / pdfFiles.length) * 100),
      stage: `Rendering ${pdf.name}`,
      etaSeconds: Math.max(0, pdfFiles.length - index - 1) * 3,
    });
  }
  return results;
}

async function mergePdfs(
  files: PickedFile[],
  outputDir: string,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const pdfFiles = files.filter(file => file.extension === 'pdf');
  if (pdfFiles.length < 2) {
    throw new Error('Select at least two PDFs to merge.');
  }
  if (shouldCancel()) {
    throw new Error('cancelled');
  }
  onProgress({percent: 40, stage: 'Preparing PDFs', etaSeconds: 2});
  const outputPath = await mergeMultiplePDFs(pdfFiles, outputDir);
  onProgress({percent: 100, stage: 'Merged PDFs', etaSeconds: 0});
  return [{id: `merged-${Date.now()}`, uri: outputPath, name: `merged-${Date.now()}.pdf`, type: 'application/pdf'}];
}

async function convertHtmlLikeFiles(
  files: PickedFile[],
  outputDir: string,
  kind: 'docx' | 'txt' | 'html' | 'md',
  mimeType: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const targets = files.filter(file => {
    if (kind === 'docx') return file.extension === 'docx';
    if (kind === 'txt') return file.extension === 'txt';
    if (kind === 'html') return ['html', 'htm'].includes(file.extension);
    return ['md', 'markdown'].includes(file.extension);
  });
  if (!targets.length) {
    throw new Error('No matching input files for this document conversion.');
  }

  const results: ConversionResultFile[] = [];
  for (let index = 0; index < targets.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = targets[index];
    const outputPath = await htmlLikeToPdf(file.uri, outputDir, kind, settings.customFileName);
    results.push({
      id: `${file.id}-pdf`,
      uri: outputPath,
      name: outputPath.split('/').pop() || `${stripExtension(file.name)}.pdf`,
      type: mimeType,
    });
    onProgress({
      percent: Math.round(((index + 1) / targets.length) * 100),
      stage: `Rendering ${file.name}`,
      etaSeconds: Math.max(0, targets.length - index - 1) * 2,
    });
  }
  return results;
}

async function convertDocxToTxt(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const targets = files.filter(file => file.extension === 'docx');
  if (!targets.length) {
    throw new Error('Select DOCX files for text extraction.');
  }
  const results: ConversionResultFile[] = [];
  for (let index = 0; index < targets.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = targets[index];
    const outputPath = await docxToText(file.uri, outputDir, settings.customFileName);
    results.push({
      id: `${file.id}-txt`,
      uri: outputPath,
      name: outputPath.split('/').pop() || `${stripExtension(file.name)}.txt`,
      type: 'text/plain',
    });
    onProgress({
      percent: Math.round(((index + 1) / targets.length) * 100),
      stage: `Extracting ${file.name}`,
      etaSeconds: Math.max(0, targets.length - index - 1) * 2,
    });
  }
  return results;
}

async function convertExcelFiles(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
  worker: (inputPath: string, outputDir: string) => Promise<string>,
  mimeType: string,
  outputExtension: string,
) {
  const excelFiles = files.filter(file => ['xls', 'xlsx'].includes(file.extension));
  if (!excelFiles.length) {
    throw new Error('Select XLS or XLSX files for this conversion.');
  }
  const results: ConversionResultFile[] = [];
  for (let index = 0; index < excelFiles.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = excelFiles[index];
    const outputPath = await worker(file.uri, outputDir);
    results.push({
      id: `${file.id}-${outputExtension}`,
      uri: outputPath,
      name: outputPath.split('/').pop() || `${stripExtension(file.name)}.${outputExtension}`,
      type: mimeType,
    });
    onProgress({
      percent: Math.round(((index + 1) / excelFiles.length) * 100),
      stage: `Converting ${file.name}`,
      etaSeconds: Math.max(0, excelFiles.length - index - 1) * 2,
    });
  }
  return results;
}

async function convertCsvFiles(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const csvFiles = files.filter(file => file.extension === 'csv');
  if (!csvFiles.length) {
    throw new Error('Select CSV files for spreadsheet export.');
  }
  const results: ConversionResultFile[] = [];
  for (let index = 0; index < csvFiles.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = csvFiles[index];
    const outputPath = await csvToExcel(file.uri, outputDir);
    results.push({
      id: `${file.id}-xlsx`,
      uri: outputPath,
      name: outputPath.split('/').pop() || `${stripExtension(file.name)}.xlsx`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    onProgress({
      percent: Math.round(((index + 1) / csvFiles.length) * 100),
      stage: `Building workbook for ${file.name}`,
      etaSeconds: Math.max(0, csvFiles.length - index - 1) * 2,
    });
  }
  return results;
}

async function convertPptWithServer(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const pptFiles = files.filter(file => ['ppt', 'pptx'].includes(file.extension));
  if (!pptFiles.length) {
    throw new Error('Select PPT or PPTX files for server conversion.');
  }
  const results: ConversionResultFile[] = [];
  for (let index = 0; index < pptFiles.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = pptFiles[index];
    onProgress({
      percent: Math.round(((index + 0.4) / pptFiles.length) * 100),
      stage: `Uploading ${file.name}`,
      etaSeconds: Math.max(0, pptFiles.length - index - 1) * 5,
    });
    const outputPath = await convertWithServer(
      file.uri,
      'pdf',
      settings.serverUrl || '',
      settings.serverApiKey || '',
      file.name,
      file.type,
    );
    results.push({
      id: `${file.id}-server-pdf`,
      uri: outputPath,
      name: outputPath.split('/').pop() || `${stripExtension(file.name)}.pdf`,
      type: 'application/pdf',
    });
    onProgress({
      percent: Math.round(((index + 1) / pptFiles.length) * 100),
      stage: `Downloaded ${file.name}`,
      etaSeconds: Math.max(0, pptFiles.length - index - 1) * 2,
    });
  }
  return results;
}

async function convertOfficeFilesWithServer(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
  inputExtensions: string[],
  targetFormat: 'pdf' | 'docx',
  mimeType: string,
) {
  const supportedFiles = files.filter(file => inputExtensions.includes(file.extension));
  if (!supportedFiles.length) {
    throw new Error(`Select ${inputExtensions.join('/').toUpperCase()} files for this conversion.`);
  }

  const results: ConversionResultFile[] = [];
  for (let index = 0; index < supportedFiles.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = supportedFiles[index];
    onProgress({
      percent: Math.round(((index + 0.4) / supportedFiles.length) * 100),
      stage: `Uploading ${file.name}`,
      etaSeconds: Math.max(0, supportedFiles.length - index - 1) * 5,
    });

    const downloadedPath = await convertWithServer(
      file.uri,
      targetFormat,
      settings.serverUrl || '',
      settings.serverApiKey || '',
      file.name,
      file.type,
    );

    const targetName = buildOutputName(file.name, targetFormat, settings.customFileName);
    const outputPath = `${outputDir}/${targetName}`;
    await RNFS.copyFile(downloadedPath, outputPath);

    results.push({
      id: `${file.id}-${targetFormat}`,
      uri: outputPath,
      name: targetName,
      type: mimeType,
    });

    onProgress({
      percent: Math.round(((index + 1) / supportedFiles.length) * 100),
      stage: `Downloaded ${file.name}`,
      etaSeconds: Math.max(0, supportedFiles.length - index - 1) * 2,
    });
  }

  return results;
}

async function convertPdfToDocxWithServer(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  return convertOfficeFilesWithServer(
    files,
    outputDir,
    settings,
    onProgress,
    shouldCancel,
    ['pdf'],
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
}

async function convertPptToText(
  files: PickedFile[],
  outputDir: string,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
  shouldCancel: CancelCallback,
) {
  const pptFiles = files.filter(file => ['ppt', 'pptx'].includes(file.extension));
  if (!pptFiles.length) {
    throw new Error('Select PPT or PPTX files for text extraction.');
  }
  const results: ConversionResultFile[] = [];
  for (let index = 0; index < pptFiles.length; index += 1) {
    if (shouldCancel()) throw new Error('cancelled');
    const file = pptFiles[index];
    const outputPath = await extractPresentationText(file.uri, outputDir);
    results.push({
      id: `${file.id}-txt`,
      uri: outputPath,
      name: outputPath.split('/').pop() || `${stripExtension(file.name)}.txt`,
      type: 'text/plain',
    });
    onProgress({
      percent: Math.round(((index + 1) / pptFiles.length) * 100),
      stage: `Extracting basic text from ${file.name}`,
      etaSeconds: Math.max(0, pptFiles.length - index - 1),
    });
  }
  return results;
}

async function prepareImageForPdf(file: PickedFile, quality: number) {
  if (file.extension === 'png') {
    return {uri: await ensurePdfLocalPath(file.uri, file.name), format: 'png' as const};
  }
  const normalized = await normalizeImageInput(file, quality);
  return {uri: await ensurePdfLocalPath(normalized.uri, file.name), format: 'jpg' as const};
}

async function normalizeImageInput(file: PickedFile, quality: number) {
  if (file.extension === 'heic') {
    const path = await convertHeic(file.uri, 'JPEG', quality);
    return {uri: path, extension: 'jpg'};
  }
  if (['bmp', 'gif', 'webp'].includes(file.extension)) {
    const outputPath = await convertImageFormat(file.uri, 'JPEG', quality);
    return {uri: outputPath, extension: 'jpg'};
  }
  return {uri: file.uri, extension: file.extension};
}

async function copyGeneratedPdfImage(sourcePath: string, targetPath: string) {
  const normalizedSource = sourcePath.replace('file://', '');
  await RNFS.copyFile(normalizedSource, targetPath);
  return targetPath;
}

async function ensurePdfLocalPath(uri: string, fileName: string) {
  const normalizedPath = uri.replace('file://', '');
  const exists = await RNFS.exists(normalizedPath);

  if (exists) {
    return normalizedPath;
  }

  throw new Error(`The image file ${fileName} is no longer available for PDF export.`);
}

async function createPdfImagePage(uri: string, format: 'png' | 'jpg') {
  const layout = await getPdfImageLayout(uri);

  return PDFPage.create()
    .setMediaBox(PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT)
    .drawImage(uri, format, layout);
}

async function getPdfImageLayout(uri: string) {
  try {
    const {width: imageWidth, height: imageHeight} = await getImageSize(uri);
    const maxWidth = PDF_PAGE_WIDTH - PDF_PAGE_MARGIN * 2;
    const maxHeight = PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN * 2;
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    return {
      x: (PDF_PAGE_WIDTH - width) / 2,
      y: (PDF_PAGE_HEIGHT - height) / 2,
      width,
      height,
    };
  } catch {
    return {
      x: PDF_PAGE_MARGIN,
      y: PDF_PAGE_MARGIN,
      width: PDF_PAGE_WIDTH - PDF_PAGE_MARGIN * 2,
      height: PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN * 2,
    };
  }
}

function getImageSize(uri: string) {
  const source = uri.startsWith('file://') ? uri : `file://${uri}`;

  return new Promise<{width: number; height: number}>((resolve, reject) => {
    Image.getSize(
      source,
      (width, height) => resolve({width, height}),
      reject,
    );
  });
}

function toFileUri(path: string) {
  return path.startsWith('file://') ? path : `file://${path}`;
}
