import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DocObject, DocObjectPath, DocObjectSummary, DocsMountPath } from '../../domain/docsObjects';

export interface DocsExplorerSearchState {
  query: string;
  resultPaths: DocObjectPath[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}

export interface DocsExplorerState {
  mountPaths: DocsMountPath[];
  summariesByPath: Record<string, DocObjectSummary>;
  summaryPathsByMount: Record<string, DocObjectPath[]>;
  selectedPath?: DocObjectPath;
  objectCache: Record<string, DocObject>;
  syncStatus: 'idle' | 'loading' | 'ready' | 'error';
  syncError?: string;
  search: DocsExplorerSearchState;
}

const initialState: DocsExplorerState = {
  mountPaths: [],
  summariesByPath: {},
  summaryPathsByMount: {},
  objectCache: {},
  syncStatus: 'idle',
  search: {
    query: '',
    resultPaths: [],
    status: 'idle',
  },
};

export const docsExplorerSlice = createSlice({
  name: 'docsExplorer',
  initialState,
  reducers: {
    docsSyncStarted(state) {
      state.syncStatus = 'loading';
      state.syncError = undefined;
    },
    docsSyncSucceeded(
      state,
      action: PayloadAction<{
        mountPaths: DocsMountPath[];
        summaries: DocObjectSummary[];
      }>,
    ) {
      state.mountPaths = action.payload.mountPaths;
      state.summariesByPath = Object.fromEntries(action.payload.summaries.map((summary) => [summary.path, summary]));
      state.summaryPathsByMount = action.payload.mountPaths.reduce<Record<string, DocObjectPath[]>>((acc, mountPath) => {
        acc[mountPath] = action.payload.summaries
          .filter((summary) => summary.mountPath === mountPath)
          .map((summary) => summary.path);
        return acc;
      }, {});
      state.syncStatus = 'ready';
      state.syncError = undefined;
    },
    docsSyncFailed(state, action: PayloadAction<string>) {
      state.syncStatus = 'error';
      state.syncError = action.payload;
    },
    selectDocObjectPath(state, action: PayloadAction<DocObjectPath | undefined>) {
      state.selectedPath = action.payload;
    },
    cacheDocObject(state, action: PayloadAction<DocObject>) {
      state.objectCache[action.payload.path] = action.payload;
    },
    docsSearchStarted(state, action: PayloadAction<string>) {
      state.search.query = action.payload;
      state.search.status = 'loading';
      state.search.error = undefined;
    },
    docsSearchSucceeded(
      state,
      action: PayloadAction<{
        query: string;
        results: DocObjectSummary[];
      }>,
    ) {
      state.search.query = action.payload.query;
      state.search.resultPaths = action.payload.results.map((result) => result.path);
      state.search.status = 'ready';
      state.search.error = undefined;
      for (const result of action.payload.results) {
        state.summariesByPath[result.path] = result;
      }
    },
    docsSearchFailed(state, action: PayloadAction<string>) {
      state.search.status = 'error';
      state.search.error = action.payload;
    },
  },
});

export const docsExplorerReducer = docsExplorerSlice.reducer;
export const {
  cacheDocObject,
  docsSearchFailed,
  docsSearchStarted,
  docsSearchSucceeded,
  docsSyncFailed,
  docsSyncStarted,
  docsSyncSucceeded,
  selectDocObjectPath,
} = docsExplorerSlice.actions;
