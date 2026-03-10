import { KanbanBoardFrame, kanbanActions } from '@hypercard/rich-widgets/kanban-runtime';
import type { KanbanAction, KanbanState, Column, Priority, TagId, Task } from '@hypercard/rich-widgets/kanban-runtime';
import type { UIEventRef } from '../plugin-runtime/uiTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertEventRef(value: unknown, path: string): asserts value is UIEventRef {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  if (typeof value.handler !== 'string' || value.handler.length === 0) {
    throw new Error(`${path}.handler must be a non-empty string`);
  }
}

function assertColumn(value: unknown, path: string): asserts value is Column {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  if (typeof value.id !== 'string' || value.id.length === 0) {
    throw new Error(`${path}.id must be a non-empty string`);
  }

  if (typeof value.title !== 'string') {
    throw new Error(`${path}.title must be a string`);
  }

  if (typeof value.icon !== 'string') {
    throw new Error(`${path}.icon must be a string`);
  }
}

function assertPriority(value: unknown, path: string): asserts value is Priority {
  if (value !== 'high' && value !== 'medium' && value !== 'low') {
    throw new Error(`${path} must be high|medium|low`);
  }
}

function assertTagId(value: unknown, path: string): asserts value is TagId {
  if (value !== 'bug' && value !== 'feature' && value !== 'urgent' && value !== 'design' && value !== 'docs') {
    throw new Error(`${path} must be a supported tag`);
  }
}

function assertTask(value: unknown, path: string): asserts value is Task {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  if (typeof value.id !== 'string' || value.id.length === 0) {
    throw new Error(`${path}.id must be a non-empty string`);
  }

  if (typeof value.col !== 'string' || value.col.length === 0) {
    throw new Error(`${path}.col must be a non-empty string`);
  }

  if (typeof value.title !== 'string') {
    throw new Error(`${path}.title must be a string`);
  }

  if (typeof value.desc !== 'string') {
    throw new Error(`${path}.desc must be a string`);
  }

  if (!Array.isArray(value.tags)) {
    throw new Error(`${path}.tags must be an array`);
  }
  value.tags.forEach((tag, index) => assertTagId(tag, `${path}.tags[${index}]`));
  assertPriority(value.priority, `${path}.priority`);
}

function assertPartialTask(value: unknown, path: string): asserts value is Partial<Task> | null {
  if (value === null || value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    throw new Error(`${path} must be an object|null`);
  }

  if (value.id !== undefined && typeof value.id !== 'string') {
    throw new Error(`${path}.id must be a string`);
  }

  if (value.col !== undefined && typeof value.col !== 'string') {
    throw new Error(`${path}.col must be a string`);
  }

  if (value.title !== undefined && typeof value.title !== 'string') {
    throw new Error(`${path}.title must be a string`);
  }

  if (value.desc !== undefined && typeof value.desc !== 'string') {
    throw new Error(`${path}.desc must be a string`);
  }

  if (value.tags !== undefined) {
    if (!Array.isArray(value.tags)) {
      throw new Error(`${path}.tags must be an array`);
    }
    value.tags.forEach((tag, index) => assertTagId(tag, `${path}.tags[${index}]`));
  }

  if (value.priority !== undefined) {
    assertPriority(value.priority, `${path}.priority`);
  }
}

function assertCollapsedCols(value: unknown, path: string): asserts value is Record<string, boolean> {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'boolean') {
      throw new Error(`${path}.${key} must be a boolean`);
    }
  }
}

export interface KanbanV1Node {
  kind: 'kanban.board';
  props: {
    tasks: Task[];
    columns: Column[];
    editingTask: Partial<Task> | null;
    filterTag: TagId | null;
    filterPriority: Priority | null;
    searchQuery: string;
    collapsedCols: Record<string, boolean>;
    onOpenTaskEditor?: UIEventRef;
    onCloseTaskEditor?: UIEventRef;
    onSaveTask?: UIEventRef;
    onDeleteTask?: UIEventRef;
    onMoveTask?: UIEventRef;
    onSearchChange?: UIEventRef;
    onToggleTag?: UIEventRef;
    onTogglePriority?: UIEventRef;
    onClearFilters?: UIEventRef;
    onToggleCollapsed?: UIEventRef;
  };
}

export function validateKanbanV1Node(value: unknown): KanbanV1Node {
  if (!isRecord(value)) {
    throw new Error('root must be an object');
  }

  if (value.kind !== 'kanban.board') {
    throw new Error(`root.kind must be 'kanban.board'`);
  }

  if (!isRecord(value.props)) {
    throw new Error('root.props must be an object');
  }

  const { props } = value;

  if (!Array.isArray(props.tasks)) {
    throw new Error('root.props.tasks must be an array');
  }
  props.tasks.forEach((task, index) => assertTask(task, `root.props.tasks[${index}]`));

  if (!Array.isArray(props.columns)) {
    throw new Error('root.props.columns must be an array');
  }
  props.columns.forEach((column, index) => assertColumn(column, `root.props.columns[${index}]`));

  assertPartialTask(props.editingTask ?? null, 'root.props.editingTask');

  if (props.filterTag !== undefined && props.filterTag !== null) {
    assertTagId(props.filterTag, 'root.props.filterTag');
  }

  if (props.filterPriority !== undefined && props.filterPriority !== null) {
    assertPriority(props.filterPriority, 'root.props.filterPriority');
  }

  if (props.searchQuery !== undefined && typeof props.searchQuery !== 'string') {
    throw new Error('root.props.searchQuery must be a string');
  }

  if (props.collapsedCols !== undefined) {
    assertCollapsedCols(props.collapsedCols, 'root.props.collapsedCols');
  }

  assertEventRef(props.onOpenTaskEditor, 'root.props.onOpenTaskEditor');
  assertEventRef(props.onCloseTaskEditor, 'root.props.onCloseTaskEditor');
  assertEventRef(props.onSaveTask, 'root.props.onSaveTask');
  assertEventRef(props.onDeleteTask, 'root.props.onDeleteTask');
  assertEventRef(props.onMoveTask, 'root.props.onMoveTask');
  assertEventRef(props.onSearchChange, 'root.props.onSearchChange');
  assertEventRef(props.onToggleTag, 'root.props.onToggleTag');
  assertEventRef(props.onTogglePriority, 'root.props.onTogglePriority');
  assertEventRef(props.onClearFilters, 'root.props.onClearFilters');
  assertEventRef(props.onToggleCollapsed, 'root.props.onToggleCollapsed');

  return {
    kind: 'kanban.board',
    props: {
      tasks: props.tasks as Task[],
      columns: props.columns as Column[],
      editingTask: (props.editingTask as Partial<Task> | null | undefined) ?? null,
      filterTag: (props.filterTag as TagId | null | undefined) ?? null,
      filterPriority: (props.filterPriority as Priority | null | undefined) ?? null,
      searchQuery: typeof props.searchQuery === 'string' ? props.searchQuery : '',
      collapsedCols: isRecord(props.collapsedCols) ? (props.collapsedCols as Record<string, boolean>) : {},
      onOpenTaskEditor: props.onOpenTaskEditor as UIEventRef | undefined,
      onCloseTaskEditor: props.onCloseTaskEditor as UIEventRef | undefined,
      onSaveTask: props.onSaveTask as UIEventRef | undefined,
      onDeleteTask: props.onDeleteTask as UIEventRef | undefined,
      onMoveTask: props.onMoveTask as UIEventRef | undefined,
      onSearchChange: props.onSearchChange as UIEventRef | undefined,
      onToggleTag: props.onToggleTag as UIEventRef | undefined,
      onTogglePriority: props.onTogglePriority as UIEventRef | undefined,
      onClearFilters: props.onClearFilters as UIEventRef | undefined,
      onToggleCollapsed: props.onToggleCollapsed as UIEventRef | undefined,
    },
  };
}

function mergeArgs(eventArgs: unknown, payload: Record<string, unknown>): unknown {
  if (!isRecord(eventArgs)) {
    return payload;
  }

  return {
    ...eventArgs,
    ...payload,
  };
}

function emitEvent(ref: UIEventRef | undefined, onEvent: (handler: string, args?: unknown) => void, payload?: Record<string, unknown>) {
  if (!ref) {
    return;
  }

  if (payload) {
    onEvent(ref.handler, mergeArgs(ref.args, payload));
    return;
  }

  onEvent(ref.handler, ref.args);
}

export interface KanbanV1RendererProps {
  tree: KanbanV1Node;
  onEvent: (handler: string, args?: unknown) => void;
}

export function KanbanV1Renderer({ tree, onEvent }: KanbanV1RendererProps) {
  const { props } = tree;
  const state: KanbanState = {
    initialized: true,
    tasks: props.tasks,
    columns: props.columns,
    editingTask: props.editingTask,
    filterTag: props.filterTag,
    filterPriority: props.filterPriority,
    searchQuery: props.searchQuery,
    collapsedCols: props.collapsedCols,
  };

  const dispatch = (action: KanbanAction) => {
    switch (action.type) {
      case kanbanActions.setEditingTask.type:
        if (action.payload === null) {
          emitEvent(props.onCloseTaskEditor, onEvent);
          return;
        }
        emitEvent(props.onOpenTaskEditor, onEvent, { task: action.payload as Record<string, unknown> });
        return;
      case kanbanActions.upsertTask.type:
        emitEvent(props.onSaveTask, onEvent, { task: action.payload as unknown as Record<string, unknown> });
        return;
      case kanbanActions.deleteTask.type:
        emitEvent(props.onDeleteTask, onEvent, { id: String(action.payload ?? '') });
        return;
      case kanbanActions.moveTask.type:
        emitEvent(props.onMoveTask, onEvent, action.payload as Record<string, unknown>);
        return;
      case kanbanActions.setSearchQuery.type:
        emitEvent(props.onSearchChange, onEvent, { value: String(action.payload ?? '') });
        return;
      case kanbanActions.setFilterTag.type:
        emitEvent(props.onToggleTag, onEvent, { tag: action.payload });
        return;
      case kanbanActions.setFilterPriority.type:
        emitEvent(props.onTogglePriority, onEvent, { priority: action.payload });
        return;
      case kanbanActions.clearFilters.type:
        emitEvent(props.onClearFilters, onEvent);
        return;
      case kanbanActions.toggleCollapsed.type:
        emitEvent(props.onToggleCollapsed, onEvent, { columnId: String(action.payload ?? '') });
        return;
      default:
        return;
    }
  };

  return <KanbanBoardFrame state={state} dispatch={dispatch} />;
}
