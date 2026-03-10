import {
  debugReducer,
  notificationsReducer,
} from '@hypercard/engine';
import { hypercardArtifactsReducer, pluginCardRuntimeReducer } from '@hypercard/hypercard-runtime';
import { windowingReducer } from '@hypercard/engine/desktop-core';
import { configureStore } from '@reduxjs/toolkit';
import { appsApi } from '../api/appsApi';
import { docsRegistry, type DocsRegistry } from '../domain/docsRegistry';
import { appsBrowserReducer } from '../features/appsBrowser/appsBrowserSlice';
import { attachDocsRegistrySync } from '../features/docsExplorer/docsRegistrySync';
import { docsExplorerReducer } from '../features/docsExplorer/docsExplorerSlice';

function createAppsBrowserStore(options?: {
  docsRegistry?: DocsRegistry;
  enableDocsRegistrySync?: boolean;
}) {
  const store = configureStore({
    reducer: {
      // Engine built-ins (mirrors createAppStore)
      pluginCardRuntime: pluginCardRuntimeReducer,
      windowing: windowingReducer,
      notifications: notificationsReducer,
      debug: debugReducer,
      hypercardArtifacts: hypercardArtifactsReducer,
      // Domain
      appsBrowser: appsBrowserReducer,
      docsExplorer: docsExplorerReducer,
      // RTK Query
      [appsApi.reducerPath]: appsApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(appsApi.middleware),
  });

  if (options?.enableDocsRegistrySync !== false) {
    attachDocsRegistrySync(store, options?.docsRegistry ?? docsRegistry);
  }

  return store;
}

export const store = createAppsBrowserStore();
export { createAppsBrowserStore };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
