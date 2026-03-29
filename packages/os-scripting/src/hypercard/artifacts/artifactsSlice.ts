import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ArtifactSource = 'widget' | 'card';

export interface ArtifactRecord {
  id: string;
  title: string;
  template: string;
  data: Record<string, unknown>;
  source: ArtifactSource;
  updatedAt: number;
  runtimeSurfaceId?: string;
  runtimeSurfaceCode?: string;
  packId?: string;
  injectionStatus?: 'pending' | 'injected' | 'failed';
  injectionError?: string;
}

export interface ArtifactsState {
  byId: Record<string, ArtifactRecord>;
}

const initialState: ArtifactsState = {
  byId: {},
};

function cleanString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

const artifactsSlice = createSlice({
  name: 'artifacts',
  initialState,
  reducers: {
    upsertArtifact(
      state,
      action: PayloadAction<{
        id: string;
        title?: string;
        template?: string;
        data?: Record<string, unknown>;
        source: ArtifactSource;
        updatedAt?: number;
        runtimeSurfaceId?: string;
        runtimeSurfaceCode?: string;
        packId?: string;
        queueForInjection?: boolean;
      }>,
    ) {
      const id = cleanString(action.payload.id);
      if (!id) {
        return;
      }
      const existing = state.byId[id];
      const title = cleanString(action.payload.title) ?? existing?.title ?? id;
      const template = cleanString(action.payload.template) ?? existing?.template ?? '';
      const data =
        action.payload.data !== undefined
          ? cleanObject(action.payload.data)
          : existing?.data ?? {};
      const source = action.payload.source ?? existing?.source ?? 'widget';
      const updatedAt = action.payload.updatedAt ?? Date.now();
      const runtimeSurfaceId = cleanString(action.payload.runtimeSurfaceId) ?? existing?.runtimeSurfaceId;
      const runtimeSurfaceCode = cleanString(action.payload.runtimeSurfaceCode) ?? existing?.runtimeSurfaceCode;
      const packId = cleanString(action.payload.packId) ?? existing?.packId;
      const queueForInjection = action.payload.queueForInjection === true;
      state.byId[id] = {
        id,
        title,
        template,
        data,
        source,
        updatedAt,
        runtimeSurfaceId,
        runtimeSurfaceCode,
        packId,
        injectionStatus:
          runtimeSurfaceCode && queueForInjection
            ? (existing?.injectionStatus ?? 'pending')
            : existing?.injectionStatus,
        injectionError: existing?.injectionError,
      };
    },
    markRuntimeSurfaceInjectionResults(
      state,
      action: PayloadAction<{
        injectedSurfaceIds?: string[];
        failed?: Array<{ surfaceId: string; error?: string }>;
        updatedAt?: number;
      }>,
    ) {
      const injected = new Set(
        (action.payload.injectedSurfaceIds ?? [])
          .map((id) => cleanString(id))
          .filter((id): id is string => typeof id === 'string'),
      );
      const failed = new Map<string, string | undefined>();
      for (const item of action.payload.failed ?? []) {
        const surfaceId = cleanString(item.surfaceId);
        if (!surfaceId) continue;
        failed.set(surfaceId, cleanString(item.error));
      }
      if (injected.size === 0 && failed.size === 0) {
        return;
      }

      const updatedAt = action.payload.updatedAt ?? Date.now();
      for (const artifact of Object.values(state.byId)) {
        const runtimeSurfaceId = cleanString(artifact.runtimeSurfaceId);
        if (!runtimeSurfaceId) continue;
        if (injected.has(runtimeSurfaceId)) {
          artifact.injectionStatus = 'injected';
          artifact.injectionError = undefined;
          artifact.updatedAt = updatedAt;
          continue;
        }
        if (failed.has(runtimeSurfaceId)) {
          artifact.injectionStatus = 'failed';
          artifact.injectionError = failed.get(runtimeSurfaceId);
          artifact.updatedAt = updatedAt;
        }
      }
    },
    clearArtifacts(state) {
      state.byId = {};
    },
  },
});

export const { upsertArtifact, markRuntimeSurfaceInjectionResults, clearArtifacts } = artifactsSlice.actions;
export const artifactsReducer = artifactsSlice.reducer;
export const hypercardArtifactsReducer = artifactsSlice.reducer;
