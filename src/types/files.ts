export type SupportedInputType =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'bmp'
  | 'gif'
  | 'webp'
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'html'
  | 'htm'
  | 'md'
  | 'markdown'
  | 'xls'
  | 'xlsx'
  | 'csv'
  | 'ppt'
  | 'pptx'
  | 'heic';

export type SupportedOutputType =
  | 'pdf'
  | 'docx'
  | 'webp'
  | 'png'
  | 'jpg'
  | 'txt'
  | 'csv'
  | 'xlsx'
  | 'html';

export type ConversionCategory = 'images' | 'documents' | 'sheets' | 'slides';

export type ConversionStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled';

export type HistoryFilter = 'all' | 'pdf' | 'image' | 'webp';

export interface PickedFile {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  modifiedAt?: number;
  thumbnailUri?: string;
  extension: string;
}

export interface ConversionSettings {
  converterId?: string;
  category?: ConversionCategory;
  outputFormat: SupportedOutputType;
  quality: number;
  compression: number;
  mergeIntoSinglePdf: boolean;
  mergePdfs: boolean;
  outputFolder: string;
  customFileName?: string;
  serverUrl?: string;
  serverApiKey?: string;
}

export interface ConversionProgress {
  percent: number;
  etaSeconds?: number;
  stage: string;
}

export interface ConversionResultFile {
  id: string;
  uri: string;
  name: string;
  type: string;
  thumbnailUri?: string;
}

export interface ConversionHistoryItem {
  id: string;
  sourceFiles: PickedFile[];
  outputFiles: ConversionResultFile[];
  outputFormat: SupportedOutputType;
  converterId?: string;
  category?: ConversionCategory;
  status: ConversionStatus;
  createdAt: string;
  finishedAt?: string;
  errorMessage?: string;
}

export interface ConverterDefinition {
  id: string;
  name: string;
  category: ConversionCategory;
  inputExtensions: SupportedInputType[];
  outputFormat: SupportedOutputType;
  description: string;
  supportsBatch: boolean;
  requiresServer?: boolean;
  previewUnavailable?: boolean;
  requiresNativeModule?: 'pdfToImage' | 'webpConverter';
}
