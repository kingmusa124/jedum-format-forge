import RNFS from 'react-native-fs';
import MarkdownIt from 'markdown-it';
import mammoth from 'mammoth';
import {buildOutputName} from '@app/utils/fileName';

const md = new MarkdownIt();
const RNHTMLtoPDF: any = require('react-native-html-to-pdf');

export async function docxToText(inputPath: string, outputDir: string, customFileName?: string) {
  const fileData = await RNFS.readFile(inputPath.replace('file://', ''), 'base64');
  const result = await mammoth.extractRawText({arrayBuffer: base64ToArrayBuffer(fileData)});
  const outputName = buildOutputName(customFileName || `docx-export-${Date.now()}`, 'txt');
  const outputPath = `${outputDir}/${outputName}`;
  await RNFS.writeFile(outputPath, result.value, 'utf8');
  return outputPath;
}

export async function htmlLikeToPdf(
  inputPath: string,
  outputDir: string,
  kind: 'docx' | 'txt' | 'html' | 'md',
  customFileName?: string,
) {
  let html = '';
  const normalized = inputPath.replace('file://', '');

  if (kind === 'docx') {
    const fileData = await RNFS.readFile(normalized, 'base64');
    const result = await mammoth.convertToHtml({arrayBuffer: base64ToArrayBuffer(fileData)});
    html = result.value;
  } else if (kind === 'txt') {
    const text = await RNFS.readFile(normalized, 'utf8');
    html = `<pre>${escapeHtml(text)}</pre>`;
  } else if (kind === 'md') {
    const text = await RNFS.readFile(normalized, 'utf8');
    html = md.render(text);
  } else {
    html = await RNFS.readFile(normalized, 'utf8');
  }

  const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body { font-family: Helvetica; padding: 24px; color: #1A2233; }
    pre { white-space: pre-wrap; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ddd; padding: 8px; }
  </style></head><body>${html}</body></html>`;

  const fileName = buildOutputName(customFileName || `document-export-${Date.now()}`, 'pdf');
  const pdf = await RNHTMLtoPDF.convert({
    html: wrapped,
    fileName: fileName.replace(/\.pdf$/, ''),
    directory: outputDir,
  });

  if (!pdf.filePath) {
    throw new Error('HTML to PDF conversion did not return a file path.');
  }
  return pdf.filePath;
}

function base64ToArrayBuffer(base64: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64.replace(/=+$/, '');
  let bufferLength = (str.length * 3) / 4;
  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string.');
  }

  const bytes = new Uint8Array(bufferLength | 0);
  let p = 0;

  for (let i = 0; i < str.length; i += 4) {
    const encoded1 = chars.indexOf(str[i]);
    const encoded2 = chars.indexOf(str[i + 1]);
    const encoded3 = chars.indexOf(str[i + 2]);
    const encoded4 = chars.indexOf(str[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== 64 && encoded3 !== -1) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (encoded4 !== 64 && encoded4 !== -1) {
      bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
    }
  }

  return bytes.buffer.slice(0, p);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
