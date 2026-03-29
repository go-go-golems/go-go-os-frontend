import {
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import {
  createKanbanStateSeed,
  KANBAN_STATE_KEY,
  kanbanActions,
  kanbanReducer,
  selectKanbanState,
  type KanbanAction,
  type KanbanState,
} from './kanbanState';
import type {
  Column,
  KanbanHighlight,
  KanbanPriorityId,
  KanbanIssueTypeId,
  KanbanTaxonomy,
  Task,
} from './types';
import type { KanbanStatusMetric } from './KanbanStatusBar';
import { KanbanBoardView } from './KanbanBoardView';

// ── Props ────────────────────────────────────────────────────────────
export interface KanbanBoardProps {
  initialTasks?: Task[];
  initialColumns?: Column[];
  initialTaxonomy?: KanbanTaxonomy;
  initialEditingTask?: Partial<Task> | null;
  initialFilterType?: KanbanIssueTypeId | null;
  initialFilterPriority?: KanbanPriorityId | null;
  initialSearchQuery?: string;
  initialCollapsedCols?: Record<string, boolean>;
  title?: string;
  subtitle?: string;
  primaryActionLabel?: string;
  showFilterBar?: boolean;
  statusMetrics?: KanbanStatusMetric[] | null;
  highlights?: KanbanHighlight[] | null;
}

function createInitialSeed(props: KanbanBoardProps) {
  return createKanbanStateSeed({
    initialTasks: props.initialTasks ?? INITIAL_TASKS,
    initialColumns: props.initialColumns ?? INITIAL_COLUMNS,
    initialTaxonomy: props.initialTaxonomy,
    editingTask: props.initialEditingTask,
    filterType: props.initialFilterType,
    filterPriority: props.initialFilterPriority,
    searchQuery: props.initialSearchQuery,
    collapsedCols: props.initialCollapsedCols,
  });
}

export function KanbanBoardFrame({
  state,
  dispatch,
  title,
  subtitle,
  primaryActionLabel,
  showFilterBar,
  statusMetrics,
  highlights,
}: {
  state: KanbanState;
  dispatch: (action: KanbanAction) => void;
  title?: string;
  subtitle?: string;
  primaryActionLabel?: string;
  showFilterBar?: boolean;
  statusMetrics?: KanbanStatusMetric[] | null;
  highlights?: KanbanHighlight[] | null;
}) {
  return (
    <KanbanBoardView
      state={state}
      title={title}
      subtitle={subtitle}
      primaryActionLabel={primaryActionLabel}
      showFilterBar={showFilterBar}
      statusMetrics={statusMetrics}
      highlights={highlights}
      onOpenTaskEditor={(task) => dispatch(kanbanActions.setEditingTask(task))}
      onCloseTaskEditor={() => dispatch(kanbanActions.setEditingTask(null))}
      onSaveTask={(task: Task) => dispatch(kanbanActions.upsertTask(task))}
      onDeleteTask={(id) => dispatch(kanbanActions.deleteTask(id))}
      onMoveTask={(payload) => dispatch(kanbanActions.moveTask(payload))}
      onSearchChange={(value) => dispatch(kanbanActions.setSearchQuery(value))}
      onSetFilterType={(type) => dispatch(kanbanActions.setFilterType(type))}
      onSetFilterPriority={(priority) => dispatch(kanbanActions.setFilterPriority(priority))}
      onClearFilters={() => dispatch(kanbanActions.clearFilters())}
      onToggleCollapsed={(columnId) => dispatch(kanbanActions.toggleCollapsed(columnId))}
    />
  );
}

function StandaloneKanbanBoard(props: KanbanBoardProps) {
  const [state, dispatch] = useReducer(kanbanReducer, createInitialSeed(props));

  return (
    <KanbanBoardFrame
      state={state}
      dispatch={dispatch}
      title={props.title}
      subtitle={props.subtitle}
      primaryActionLabel={props.primaryActionLabel}
      showFilterBar={props.showFilterBar}
      statusMetrics={props.statusMetrics}
      highlights={props.highlights}
    />
  );
}

function ConnectedKanbanBoard(props: KanbanBoardProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectKanbanState);

  useEffect(() => {
    reduxDispatch(kanbanActions.initializeIfNeeded(createInitialSeed(props)));
  }, [
    props.initialCollapsedCols,
    props.initialColumns,
    props.initialEditingTask,
    props.initialFilterPriority,
    props.initialFilterType,
    props.initialSearchQuery,
    props.initialTasks,
    props.initialTaxonomy,
    reduxDispatch,
  ]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  const dispatch = useCallback((action: KanbanAction) => {
    reduxDispatch(action);
  }, [reduxDispatch]);

  return (
    <KanbanBoardFrame
      state={effectiveState}
      dispatch={dispatch}
      title={props.title}
      subtitle={props.subtitle}
      primaryActionLabel={props.primaryActionLabel}
      showFilterBar={props.showFilterBar}
      statusMetrics={props.statusMetrics}
      highlights={props.highlights}
    />
  );
}

// ── Component ────────────────────────────────────────────────────────
export function KanbanBoard(props: KanbanBoardProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    KANBAN_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedKanbanBoard {...props} />;
  }

  return <StandaloneKanbanBoard {...props} />;
}
