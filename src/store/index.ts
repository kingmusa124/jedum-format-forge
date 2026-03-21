import {configureStore} from '@reduxjs/toolkit';
import conversionReducer from '@app/store/slices/conversionSlice';
import historyReducer from '@app/store/slices/historySlice';
import settingsReducer from '@app/store/slices/settingsSlice';

export const store = configureStore({
  reducer: {
    conversion: conversionReducer,
    history: historyReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
