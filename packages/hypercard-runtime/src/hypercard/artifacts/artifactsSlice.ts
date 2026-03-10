import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ArtifactSource = 'widget' | 'card';

export interface ArtifactRecord {
  id: string;
  title: string;
  template: string;
  data: Record<string, unknown>;
  source: ArtifactSource;
  updatedAt: number;
  runtimeCardId?: string;
  runtimeCardCode?: string;
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
        runtimeCardId?: string;
        runtimeCardCode?: string;
        packId?: string;
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
      const runtimeCardId = cleanString(action.payload.runtimeCardId) ?? existing?.runtimeCardId;
      const runtimeCardCode = cleanString(action.payload.runtimeCardCode) ?? existing?.runtimeCardCode;
      const packId = cleanString(action.payload.packId) ?? existing?.packId;
      state.byId[id] = {
        id,
        title,
        template,
        data,
        source,
        updatedAt,
        runtimeCardId,
        runtimeCardCode,
        packId,
        injectionStatus: runtimeCardCode ? (existing?.injectionStatus ?? 'pending') : existing?.injectionStatus,
        injectionError: existing?.injectionError,
      };
    },
    markRuntimeCardInjectionResults(
      state,
      action: PayloadAction<{
        injectedCardIds?: string[];
        failed?: Array<{ cardId: string; error?: string }>;
        updatedAt?: number;
      }>,
    ) {
      const injected = new Set(
        (action.payload.injectedCardIds ?? [])
          .map((id) => cleanString(id))
          .filter((id): id is string => typeof id === 'string'),
      );
      const failed = new Map<string, string | undefined>();
      for (const item of action.payload.failed ?? []) {
        const cardId = cleanString(item.cardId);
        if (!cardId) continue;
        failed.set(cardId, cleanString(item.error));
      }
      if (injected.size === 0 && failed.size === 0) {
        return;
      }

      const updatedAt = action.payload.updatedAt ?? Date.now();
      for (const artifact of Object.values(state.byId)) {
        const runtimeCardId = cleanString(artifact.runtimeCardId);
        if (!runtimeCardId) continue;
        if (injected.has(runtimeCardId)) {
          artifact.injectionStatus = 'injected';
          artifact.injectionError = undefined;
          artifact.updatedAt = updatedAt;
          continue;
        }
        if (failed.has(runtimeCardId)) {
          artifact.injectionStatus = 'failed';
          artifact.injectionError = failed.get(runtimeCardId);
          artifact.updatedAt = updatedAt;
        }
      }
    },
    clearArtifacts(state) {
      state.byId = {};
    },
  },
});

export const { upsertArtifact, markRuntimeCardInjectionResults, clearArtifacts } = artifactsSlice.actions;
export const artifactsReducer = artifactsSlice.reducer;
export const hypercardArtifactsReducer = artifactsSlice.reducer;
