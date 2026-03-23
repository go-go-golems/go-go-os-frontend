import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import {
  cloneKanbanTaxonomy,
  normalizeKanbanTaxonomy,
  type Column,
  type KanbanPriorityId,
  type KanbanIssueTypeId,
  type KanbanTaxonomy,
  type Task,
} from './types';

export const KANBAN_STATE_KEY = 'app_rw_kanban' as const;

export interface KanbanStateSeed {
  initialTasks?: readonly Task[];
  initialColumns?: readonly Column[];
  initialTaxonomy?: KanbanTaxonomy;
  editingTask?: Partial<Task> | null;
  filterType?: KanbanIssueTypeId | null;
  filterPriority?: KanbanPriorityId | null;
  searchQuery?: string;
  collapsedCols?: Record<string, boolean>;
}

export interface KanbanState {
  initialized: boolean;
  tasks: Task[];
  columns: Column[];
  taxonomy: KanbanTaxonomy;
  editingTask: Partial<Task> | null;
  filterType: KanbanIssueTypeId | null;
  filterPriority: KanbanPriorityId | null;
  searchQuery: string;
  collapsedCols: Record<string, boolean>;
}

type KanbanModuleState = KanbanState | undefined;
type KanbanStateInput = KanbanStateSeed | KanbanState | undefined;

function cloneTask(task: Task): Task {
  return {
    ...task,
    labels: [...task.labels],
  };
}

function clonePartialTask(task: Partial<Task> | null | undefined): Partial<Task> | null {
  if (!task) {
    return null;
  }

  return {
    ...task,
    labels: task.labels ? [...task.labels] : undefined,
  };
}

function cloneColumn(column: Column): Column {
  return { ...column };
}

export function createKanbanStateSeed(
  seed: KanbanStateSeed = {},
): KanbanState {
  return {
    initialized: true,
    tasks: (seed.initialTasks ?? INITIAL_TASKS).map(cloneTask),
    columns: (seed.initialColumns ?? INITIAL_COLUMNS).map(cloneColumn),
    taxonomy: normalizeKanbanTaxonomy(seed.initialTaxonomy),
    editingTask: clonePartialTask(seed.editingTask),
    filterType: seed.filterType ?? null,
    filterPriority: seed.filterPriority ?? null,
    searchQuery: seed.searchQuery ?? '',
    collapsedCols: { ...(seed.collapsedCols ?? {}) },
  };
}

function materializeKanbanState(seed: KanbanStateInput): KanbanState {
  if (seed && typeof seed === 'object' && 'tasks' in seed && 'columns' in seed) {
    return {
      ...seed,
      tasks: seed.tasks.map(cloneTask),
      columns: seed.columns.map(cloneColumn),
      taxonomy: cloneKanbanTaxonomy(seed.taxonomy),
      editingTask: clonePartialTask(seed.editingTask),
      collapsedCols: { ...seed.collapsedCols },
    };
  }

  return createKanbanStateSeed(seed);
}

const initialState: KanbanState = {
  ...createKanbanStateSeed(),
  initialized: false,
};

export const kanbanSlice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<KanbanStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeKanbanState(action.payload);
    },
    replaceState(_state, action: PayloadAction<KanbanStateInput>) {
      return materializeKanbanState(action.payload);
    },
    upsertTask(state, action: PayloadAction<Task>) {
      const nextTask = cloneTask(action.payload);
      const existingIndex = state.tasks.findIndex((task) => task.id === nextTask.id);
      if (existingIndex >= 0) {
        state.tasks[existingIndex] = nextTask;
      } else {
        state.tasks.push(nextTask);
      }
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      if (state.editingTask?.id === action.payload) {
        state.editingTask = null;
      }
    },
    moveTask(state, action: PayloadAction<{ id: string; col: string }>) {
      const task = state.tasks.find((item) => item.id === action.payload.id);
      if (task) {
        task.col = action.payload.col;
      }
    },
    setEditingTask(state, action: PayloadAction<Partial<Task> | null>) {
      state.editingTask = clonePartialTask(action.payload);
    },
    setFilterType(state, action: PayloadAction<KanbanIssueTypeId | null>) {
      state.filterType = action.payload;
    },
    setFilterPriority(state, action: PayloadAction<KanbanPriorityId | null>) {
      state.filterPriority = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    clearFilters(state) {
      state.filterType = null;
      state.filterPriority = null;
      state.searchQuery = '';
    },
    toggleCollapsed(state, action: PayloadAction<string>) {
      state.collapsedCols = {
        ...state.collapsedCols,
        [action.payload]: !state.collapsedCols[action.payload],
      };
    },
  },
});

export const kanbanReducer = kanbanSlice.reducer;
export const kanbanActions = kanbanSlice.actions;
export type KanbanAction = ReturnType<
  (typeof kanbanActions)[keyof typeof kanbanActions]
>;

const selectRawKanbanState = (rootState: unknown): KanbanState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, KanbanModuleState>)[KANBAN_STATE_KEY]
    : undefined;

export const selectKanbanState = (rootState: unknown): KanbanState =>
  selectRawKanbanState(rootState) ?? initialState;
