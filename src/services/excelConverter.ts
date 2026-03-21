import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
const RNHTMLtoPDF: any = require('react-native-html-to-pdf');

export async function excelToCSV(inputPath: string, outputDir: string) {
  const fileData = await RNFS.readFile(inputPath.replace('file://', ''), 'base64');
  const workbook = XLSX.read(fileData, {type: 'base64'});
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const outputPath = `${outputDir}/converted-${Date.now()}.csv`;
  await RNFS.writeFile(outputPath, csv, 'utf8');
  return outputPath;
}

export async function excelToPDF(inputPath: string, outputDir: string) {
  const fileData = await RNFS.readFile(inputPath.replace('file://', ''), 'base64');
  const workbook = XLSX.read(fileData, {type: 'base64'});
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const htmlTable = XLSX.utils.sheet_to_html(worksheet);

  const fullHtml = `<!DOCTYPE html><html><head><style>
    body { font-family: Helvetica; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
  </style></head><body><h2>Excel Data Export</h2>${htmlTable}</body></html>`;

  const pdf = await RNHTMLtoPDF.convert({
    html: fullHtml,
    fileName: `excel-export-${Date.now()}`,
    directory: outputDir,
  });

  if (!pdf.filePath) {
    throw new Error('Excel to PDF conversion did not return a file path.');
  }
  return pdf.filePath;
}

export async function excelToHTML(inputPath: string, outputDir: string) {
  const fileData = await RNFS.readFile(inputPath.replace('file://', ''), 'base64');
  const workbook = XLSX.read(fileData, {type: 'base64'});
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const html = XLSX.utils.sheet_to_html(worksheet);
  const outputPath = `${outputDir}/excel-export-${Date.now()}.html`;
  await RNFS.writeFile(outputPath, html, 'utf8');
  return outputPath;
}

export async function csvToExcel(inputPath: string, outputDir: string) {
  const csvData = await RNFS.readFile(inputPath.replace('file://', ''), 'utf8');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(csvData.split('\n').map(row => row.split(',')));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const outputPath = `${outputDir}/converted-${Date.now()}.xlsx`;
  const wbData = XLSX.write(workbook, {type: 'base64', bookType: 'xlsx'});
  await RNFS.writeFile(outputPath, wbData, 'base64');
  return outputPath;
}
