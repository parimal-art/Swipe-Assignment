import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import candidatesSlice from './candidatesSlice'
import uiSlice from './uiSlice'

const candidatesPersistConfig = {
  key: 'candidates',
  storage,
}

const persistedCandidatesReducer = persistReducer(candidatesPersistConfig, candidatesSlice)

export const store = configureStore({
  reducer: {
    candidates: persistedCandidatesReducer,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)