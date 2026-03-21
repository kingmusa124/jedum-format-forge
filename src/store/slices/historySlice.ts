import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ConversionHistoryItem, HistoryFilter} from '@app/types/files';

interface HistoryState {
  items: ConversionHistoryItem[];
  filter: HistoryFilter;
}

const initialState: HistoryState = {
  items: [],
  filter: 'all',
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistory(state, action: PayloadAction<ConversionHistoryItem[]>) {
      state.items = action.payload;
    },
    addHistoryItem(state, action: PayloadAction<ConversionHistoryItem>) {
      state.items.unshift(action.payload);
    },
    updateHistoryItem(state, action: PayloadAction<ConversionHistoryItem>) {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      }
    },
    deleteHistoryItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearHistory(state) {
      state.items = [];
    },
    setHistoryFilter(state, action: PayloadAction<HistoryFilter>) {
      state.filter = action.payload;
    },
  },
});

export const {
  setHistory,
  addHistoryItem,
  updateHistoryItem,
  deleteHistoryItem,
  clearHistory,
  setHistoryFilter,
} = historySlice.actions;

export default historySlice.reducer;
