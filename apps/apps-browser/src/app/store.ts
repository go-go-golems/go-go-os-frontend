import {
  debugReducer,
  notificationsReducer,
} from '@go-go-golems/os-core';
import { hypercardArtifactsReducer, runtimeSessionsReducer } from '@go-go-golems/os-scripting';
import { windowingReducer } from '@go-go-golems/os-core/desktop-core';
import { configureStore } from '@reduxjs/toolkit';
import { appsApi } from '../api/appsApi';
import { appsBrowserReducer } from '../features/appsBrowser/appsBrowserSlice';

function createAppsBrowserStore() {
  return configureStore({
    reducer: {
      // Engine built-ins (mirrors createAppStore)
      runtimeSessions: runtimeSessionsReducer,
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
