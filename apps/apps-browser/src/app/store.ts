import {
  debugReducer,
  notificationsReducer,
} from '@hypercard/engine';
import { hypercardArtifactsReducer, pluginCardRuntimeReducer } from '@hypercard/hypercard-runtime';
import { windowingReducer } from '@hypercard/engine/desktop-core';
import { configureStore } from '@reduxjs/toolkit';
import { appsApi } from '../api/appsApi';
import { appsBrowserReducer } from '../features/appsBrowser/appsBrowserSlice';

function createAppsBrowserStore() {
  return configureStore({
    reducer: {
      // Engine built-ins (mirrors createAppStore)
      pluginCardRuntime: pluginCardRuntimeReducer,
      windowing: windowingReducer,
      notifications: notificationsReducer,
      debug: debugReducer,
      hypercardArtifacts: hypercardArtifactsReducer,
      // Domain
      appsBrowser: appsBrowserReducer,
      // RTK Query
      [appsApi.reducerPath]: appsApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(appsApi.middleware),
  });
}

export const store = createAppsBrowserStore();
export { createAppsBrowserStore };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
