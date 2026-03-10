import { KanbanBoardView } from '@hypercard/rich-widgets/kanban-runtime';
import type {
  KanbanState,
  Column,
  KanbanOptionDescriptor,
  KanbanPriorityId,
  KanbanIssueTypeId,
  KanbanStatusMetric,
  KanbanTaxonomy,
  Task,
} from '@hypercard/rich-widgets/kanban-runtime';
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

function assertDescriptor(value: unknown, path: string): asserts value is KanbanOptionDescriptor {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  if (typeof value.id !== 'string' || value.id.length === 0) {
    throw new Error(`${path}.id must be a non-empty string`);
  }

  if (typeof value.label !== 'string' || value.label.length === 0) {
    throw new Error(`${path}.label must be a non-empty string`);
  }

  if (value.icon !== undefined && typeof value.icon !== 'string') {
    throw new Error(`${path}.icon must be a string`);
  }

  if (value.color !== undefined && typeof value.color !== 'string') {
    throw new Error(`${path}.color must be a string`);
  }
}

function assertTaxonomy(value: unknown, path: string): asserts value is KanbanTaxonomy {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }

  if (!Array.isArray(value.issueTypes)) {
    throw new Error(`${path}.issueTypes must be an array`);
  }
  value.issueTypes.forEach((entry, index) => assertDescriptor(entry, `${path}.issueTypes[${index}]`));

  if (!Array.isArray(value.priorities)) {
    throw new Error(`${path}.priorities must be an array`);
  }
  value.priorities.forEach((entry, index) => assertDescriptor(entry, `${path}.priorities[${index}]`));

  if (!Array.isArray(value.labels)) {
    throw new Error(`${path}.labels must be an array`);
  }
  value.labels.forEach((entry, index) => assertDescriptor(entry, `${path}.labels[${index}]`));
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

  if (typeof value.type !== 'string' || value.type.length === 0) {
    throw new Error(`${path}.type must be a non-empty string`);
  }

  if (!Array.isArray(value.labels)) {
    throw new Error(`${path}.labels must be an array`);
  }
  value.labels.forEach((entry, index) => {
    if (typeof entry !== 'string') {
      throw new Error(`${path}.labels[${index}] must be a string`);
    }
  });

  if (typeof value.priority !== 'string' || value.priority.length === 0) {
    throw new Error(`${path}.priority must be a non-empty string`);
  }

  if (typeof value.desc !== 'string') {
    throw new Error(`${path}.desc must be a string`);
  }
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
  if (value.type !== undefined && typeof value.type !== 'string') {
    throw new Error(`${path}.type must be a string`);
  }
  if (value.labels !== undefined) {
    if (!Array.isArray(value.labels)) {
      throw new Error(`${path}.labels must be an array`);
    }
    value.labels.forEach((entry, index) => {
      if (typeof entry !== 'string') {
        throw new Error(`${path}.labels[${index}] must be a string`);
      }
    });
  }
  if (value.priority !== undefined && typeof value.priority !== 'string') {
    throw new Error(`${path}.priority must be a string`);
  }
  if (value.desc !== undefined && typeof value.desc !== 'string') {
    throw new Error(`${path}.desc must be a string`);
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

function assertMetrics(value: unknown, path: string): asserts value is KanbanStatusMetric[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`${path}[${index}] must be an object`);
    }
    if (typeof entry.label !== 'string') {
      throw new Error(`${path}[${index}].label must be a string`);
    }
    if (typeof entry.value !== 'string' && typeof entry.value !== 'number') {
      throw new Error(`${path}[${index}].value must be a string or number`);
    }
  });
}

interface RawKanbanNode {
  kind: string;
  props: Record<string, unknown>;
}

function assertKanbanNodeKind(value: unknown, kind: string, path: string): asserts value is RawKanbanNode {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`);
  }
  if (value.kind !== kind) {
    throw new Error(`${path}.kind must be '${kind}'`);
  }
  if (!isRecord(value.props)) {
    throw new Error(`${path}.props must be an object`);
  }
}

export interface KanbanTaxonomyNode {
  kind: 'kanban.taxonomy';
  props: KanbanTaxonomy;
}

export interface KanbanHeaderNode {
  kind: 'kanban.header';
  props: {
    title: string;
    subtitle?: string;
    primaryActionLabel?: string;
    searchQuery?: string;
    onPrimaryAction?: UIEventRef;
    onSearchChange?: UIEventRef;
  };
}

export interface KanbanFiltersNode {
  kind: 'kanban.filters';
  props: {
    filterType: KanbanIssueTypeId | null;
    filterPriority: KanbanPriorityId | null;
    onSetFilterType?: UIEventRef;
    onSetFilterPriority?: UIEventRef;
    onClearFilters?: UIEventRef;
  };
}

export interface KanbanBoardNode {
  kind: 'kanban.board';
  props: {
    tasks: Task[];
    columns: Column[];
    editingTask: Partial<Task> | null;
    collapsedCols: Record<string, boolean>;
    emptyColumnMessage?: string;
    dropHintMessage?: string;
    onOpenTaskEditor?: UIEventRef;
    onCloseTaskEditor?: UIEventRef;
    onSaveTask?: UIEventRef;
    onDeleteTask?: UIEventRef;
    onMoveTask?: UIEventRef;
    onToggleCollapsed?: UIEventRef;
  };
}

export interface KanbanStatusNode {
  kind: 'kanban.status';
  props: {
    metrics: KanbanStatusMetric[];
  };
}

export interface KanbanV1Node {
  kind: 'kanban.shell';
  props: {
    taxonomy: KanbanTaxonomyNode;
    header: KanbanHeaderNode;
    filters?: KanbanFiltersNode;
    board: KanbanBoardNode;
    status?: KanbanStatusNode;
  };
}

function validateTaxonomyNode(value: unknown, path: string): KanbanTaxonomyNode {
  assertKanbanNodeKind(value, 'kanban.taxonomy', path);
  assertTaxonomy(value.props, `${path}.props`);
  return {
    kind: 'kanban.taxonomy',
    props: value.props as KanbanTaxonomy,
  };
}

function validateHeaderNode(value: unknown, path: string): KanbanHeaderNode {
  assertKanbanNodeKind(value, 'kanban.header', path);
  const { props } = value;

  if (typeof props.title !== 'string' || props.title.length === 0) {
    throw new Error(`${path}.props.title must be a non-empty string`);
  }
  if (props.subtitle !== undefined && typeof props.subtitle !== 'string') {
    throw new Error(`${path}.props.subtitle must be a string`);
  }
  if (props.primaryActionLabel !== undefined && typeof props.primaryActionLabel !== 'string') {
    throw new Error(`${path}.props.primaryActionLabel must be a string`);
  }
  if (props.searchQuery !== undefined && typeof props.searchQuery !== 'string') {
    throw new Error(`${path}.props.searchQuery must be a string`);
  }
  assertEventRef(props.onPrimaryAction, `${path}.props.onPrimaryAction`);
  assertEventRef(props.onSearchChange, `${path}.props.onSearchChange`);

  return {
    kind: 'kanban.header',
    props: {
      title: props.title as string,
      subtitle: props.subtitle as string | undefined,
      primaryActionLabel: props.primaryActionLabel as string | undefined,
      searchQuery: props.searchQuery as string | undefined,
      onPrimaryAction: props.onPrimaryAction as UIEventRef | undefined,
      onSearchChange: props.onSearchChange as UIEventRef | undefined,
    },
  };
}

function validateFiltersNode(value: unknown, path: string): KanbanFiltersNode {
  assertKanbanNodeKind(value, 'kanban.filters', path);
  const { props } = value;

  if (props.filterType !== undefined && props.filterType !== null && typeof props.filterType !== 'string') {
    throw new Error(`${path}.props.filterType must be a string|null`);
  }
  if (props.filterPriority !== undefined && props.filterPriority !== null && typeof props.filterPriority !== 'string') {
    throw new Error(`${path}.props.filterPriority must be a string|null`);
  }
  assertEventRef(props.onSetFilterType, `${path}.props.onSetFilterType`);
  assertEventRef(props.onSetFilterPriority, `${path}.props.onSetFilterPriority`);
  assertEventRef(props.onClearFilters, `${path}.props.onClearFilters`);

  return {
    kind: 'kanban.filters',
    props: {
      filterType: (props.filterType as KanbanIssueTypeId | null | undefined) ?? null,
      filterPriority: (props.filterPriority as KanbanPriorityId | null | undefined) ?? null,
      onSetFilterType: props.onSetFilterType as UIEventRef | undefined,
      onSetFilterPriority: props.onSetFilterPriority as UIEventRef | undefined,
      onClearFilters: props.onClearFilters as UIEventRef | undefined,
    },
  };
}

function validateBoardNode(value: unknown, path: string): KanbanBoardNode {
  assertKanbanNodeKind(value, 'kanban.board', path);
  const { props } = value;

  if (!Array.isArray(props.tasks)) {
    throw new Error(`${path}.props.tasks must be an array`);
  }
  (props.tasks as unknown[]).forEach((task: unknown, index: number) => assertTask(task, `${path}.props.tasks[${index}]`));

  if (!Array.isArray(props.columns)) {
    throw new Error(`${path}.props.columns must be an array`);
  }
  (props.columns as unknown[]).forEach((column: unknown, index: number) => assertColumn(column, `${path}.props.columns[${index}]`));

  assertPartialTask(props.editingTask ?? null, `${path}.props.editingTask`);
  assertCollapsedCols(isRecord(props.collapsedCols) ? props.collapsedCols : {}, `${path}.props.collapsedCols`);

  if (props.emptyColumnMessage !== undefined && typeof props.emptyColumnMessage !== 'string') {
    throw new Error(`${path}.props.emptyColumnMessage must be a string`);
  }
  if (props.dropHintMessage !== undefined && typeof props.dropHintMessage !== 'string') {
    throw new Error(`${path}.props.dropHintMessage must be a string`);
  }

  assertEventRef(props.onOpenTaskEditor, `${path}.props.onOpenTaskEditor`);
  assertEventRef(props.onCloseTaskEditor, `${path}.props.onCloseTaskEditor`);
  assertEventRef(props.onSaveTask, `${path}.props.onSaveTask`);
  assertEventRef(props.onDeleteTask, `${path}.props.onDeleteTask`);
  assertEventRef(props.onMoveTask, `${path}.props.onMoveTask`);
  assertEventRef(props.onToggleCollapsed, `${path}.props.onToggleCollapsed`);

  return {
    kind: 'kanban.board',
    props: {
      tasks: props.tasks as Task[],
      columns: props.columns as Column[],
      editingTask: (props.editingTask as Partial<Task> | null | undefined) ?? null,
      collapsedCols: isRecord(props.collapsedCols) ? (props.collapsedCols as Record<string, boolean>) : {},
      emptyColumnMessage: props.emptyColumnMessage as string | undefined,
      dropHintMessage: props.dropHintMessage as string | undefined,
      onOpenTaskEditor: props.onOpenTaskEditor as UIEventRef | undefined,
      onCloseTaskEditor: props.onCloseTaskEditor as UIEventRef | undefined,
      onSaveTask: props.onSaveTask as UIEventRef | undefined,
      onDeleteTask: props.onDeleteTask as UIEventRef | undefined,
      onMoveTask: props.onMoveTask as UIEventRef | undefined,
      onToggleCollapsed: props.onToggleCollapsed as UIEventRef | undefined,
    },
  };
}

function validateStatusNode(value: unknown, path: string): KanbanStatusNode {
  assertKanbanNodeKind(value, 'kanban.status', path);
  assertMetrics(value.props.metrics, `${path}.props.metrics`);

  return {
    kind: 'kanban.status',
    props: {
      metrics: value.props.metrics as KanbanStatusMetric[],
    },
  };
}

export function validateKanbanV1Node(value: unknown): KanbanV1Node {
  assertKanbanNodeKind(value, 'kanban.shell', 'root');
  const { props } = value;

  return {
    kind: 'kanban.shell',
    props: {
      taxonomy: validateTaxonomyNode(props.taxonomy, 'root.props.taxonomy'),
      header: validateHeaderNode(props.header, 'root.props.header'),
      filters: props.filters === undefined ? undefined : validateFiltersNode(props.filters, 'root.props.filters'),
      board: validateBoardNode(props.board, 'root.props.board'),
      status: props.status === undefined ? undefined : validateStatusNode(props.status, 'root.props.status'),
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
  const { taxonomy, header, filters, board, status } = tree.props;
  const state: KanbanState = {
    initialized: true,
    tasks: board.props.tasks,
    columns: board.props.columns,
    taxonomy: taxonomy.props,
    editingTask: board.props.editingTask,
    filterType: filters?.props.filterType ?? null,
    filterPriority: filters?.props.filterPriority ?? null,
    searchQuery: header.props.searchQuery ?? '',
    collapsedCols: board.props.collapsedCols,
  };

  return (
    <KanbanBoardView
      state={state}
      title={header.props.title}
      subtitle={header.props.subtitle}
      primaryActionLabel={header.props.primaryActionLabel}
      showFilterBar={Boolean(filters)}
      statusMetrics={status?.props.metrics ?? null}
      emptyColumnMessage={board.props.emptyColumnMessage}
      dropHintMessage={board.props.dropHintMessage}
      onPrimaryAction={() => emitEvent(header.props.onPrimaryAction, onEvent)}
      onOpenTaskEditor={(task) => emitEvent(board.props.onOpenTaskEditor, onEvent, { task: task as unknown as Record<string, unknown> })}
      onCloseTaskEditor={() => emitEvent(board.props.onCloseTaskEditor, onEvent)}
      onSaveTask={(task) => emitEvent(board.props.onSaveTask, onEvent, { task: task as unknown as Record<string, unknown> })}
      onDeleteTask={(id) => emitEvent(board.props.onDeleteTask, onEvent, { id })}
      onMoveTask={(payload) => emitEvent(board.props.onMoveTask, onEvent, payload)}
      onSearchChange={(value) => emitEvent(header.props.onSearchChange, onEvent, { value })}
      onSetFilterType={(type) => emitEvent(filters?.props.onSetFilterType, onEvent, { type })}
      onSetFilterPriority={(priority) => emitEvent(filters?.props.onSetFilterPriority, onEvent, { priority })}
      onClearFilters={() => emitEvent(filters?.props.onClearFilters, onEvent)}
      onToggleCollapsed={(columnId) => emitEvent(board.props.onToggleCollapsed, onEvent, { columnId })}
    />
  );
}
