import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ConversionCategory, ConversionProgress, ConversionSettings, PickedFile} from '@app/types/files';

interface ConversionState {
  queue: PickedFile[];
  selectedCategory: ConversionCategory;
  selectedConverterId: string;
  selectedOutputFormat: ConversionSettings['outputFormat'];
  quality: number;
  compression: number;
  mergeIntoSinglePdf: boolean;
  mergePdfs: boolean;
  outputFolder: string;
  customFileName: string;
  serverUrl: string;
  serverApiKey: string;
  isConverting: boolean;
  activeJobId?: string;
  progress: ConversionProgress;
}

const initialState: ConversionState = {
  queue: [],
  selectedCategory: 'images',
  selectedConverterId: 'images-to-pdf',
  selectedOutputFormat: 'pdf',
  quality: 90,
  compression: 85,
  mergeIntoSinglePdf: true,
  mergePdfs: false,
  outputFolder: 'Downloads/JedumFormatForge',
  customFileName: '',
  serverUrl: '',
  serverApiKey: '',
  isConverting: false,
  progress: {
    percent: 0,
    stage: 'Waiting',
  },
};

const conversionSlice = createSlice({
  name: 'conversion',
  initialState,
  reducers: {
    setQueue(state, action: PayloadAction<PickedFile[]>) {
      state.queue = action.payload;
    },
    addToQueue(state, action: PayloadAction<PickedFile[]>) {
      state.queue.push(...action.payload);
    },
    clearQueue(state) {
      state.queue = [];
    },
    removeFromQueue(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter(file => file.id !== action.payload);
    },
    setSelectedCategory(state, action: PayloadAction<ConversionCategory>) {
      state.selectedCategory = action.payload;
    },
    setSelectedConverterId(state, action: PayloadAction<string>) {
      state.selectedConverterId = action.payload;
    },
    setSelectedOutputFormat(state, action: PayloadAction<ConversionSettings['outputFormat']>) {
      state.selectedOutputFormat = action.payload;
    },
    setQuality(state, action: PayloadAction<number>) {
      state.quality = action.payload;
    },
    setCompression(state, action: PayloadAction<number>) {
      state.compression = action.payload;
    },
    setMergeIntoSinglePdf(state, action: PayloadAction<boolean>) {
      state.mergeIntoSinglePdf = action.payload;
    },
    setMergePdfs(state, action: PayloadAction<boolean>) {
      state.mergePdfs = action.payload;
    },
    setOutputFolder(state, action: PayloadAction<string>) {
      state.outputFolder = action.payload;
    },
    setCustomFileName(state, action: PayloadAction<string>) {
      state.customFileName = action.payload;
    },
    setServerUrl(state, action: PayloadAction<string>) {
      state.serverUrl = action.payload;
    },
    setServerApiKey(state, action: PayloadAction<string>) {
      state.serverApiKey = action.payload;
    },
    beginConversion(state, action: PayloadAction<string>) {
      state.isConverting = true;
      state.activeJobId = action.payload;
      state.progress = {percent: 0, stage: 'Preparing files'};
    },
    setProgress(state, action: PayloadAction<ConversionProgress>) {
      state.progress = action.payload;
    },
    finishConversion(state) {
      state.isConverting = false;
      state.activeJobId = undefined;
      state.progress = {percent: 100, stage: 'Completed', etaSeconds: 0};
    },
    cancelConversion(state) {
      state.isConverting = false;
      state.activeJobId = undefined;
      state.progress = {percent: 0, stage: 'Cancelled'};
    },
    resetProgress(state) {
      state.progress = {percent: 0, stage: 'Waiting'};
    },
  },
});

export const {
  setQueue,
  addToQueue,
  clearQueue,
  removeFromQueue,
  setSelectedCategory,
  setSelectedConverterId,
  setSelectedOutputFormat,
  setQuality,
  setCompression,
  setMergeIntoSinglePdf,
  setMergePdfs,
  setOutputFolder,
  setCustomFileName,
  setServerUrl,
  setServerApiKey,
  beginConversion,
  setProgress,
  finishConversion,
  cancelConversion,
  resetProgress,
} = conversionSlice.actions;

export default conversionSlice.reducer;
