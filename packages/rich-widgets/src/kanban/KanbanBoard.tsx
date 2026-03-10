import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { Btn } from '@hypercard/engine';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { ModalOverlay } from '../primitives/ModalOverlay';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import type { Task, Column, TagId, Priority } from './types';
import { TAG_LABELS, PRIORITY_LABELS, ALL_TAGS, ALL_PRIORITIES } from './types';
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

// ── ID generator ──
let idSeq = 0;
const mkId = () => `task-${Date.now()}-${++idSeq}`;

// ── TaskCard ─────────────────────────────────────────────────────────
function TaskCard({
  task,
  onEdit,
  onDragStart,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onDragStart: (id: string) => void;
}) {
  return (
    <div
      data-part={P.kbCard}
      data-priority={task.priority}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        onDragStart(task.id);
      }}
      onClick={() => onEdit(task)}
    >
      <div data-part={P.kbCardTitle}>{task.title}</div>
      {task.desc && (
        <div data-part={P.kbCardDesc}>{task.desc}</div>
      )}
      {task.tags.length > 0 && (
        <div data-part={P.kbCardTags}>
          {task.tags.map((t) => (
            <span key={t} data-part={P.kbTag} data-tag={t}>
              {TAG_LABELS[t]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TaskModal ────────────────────────────────────────────────────────
function TaskModal({
  task,
  columns,
  onSave,
  onDelete,
  onClose,
}: {
  task: Partial<Task>;
  columns: Column[];
  onSave: (t: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title ?? '');
  const [desc, setDesc] = useState(task.desc ?? '');
  const [tags, setTags] = useState<TagId[]>(task.tags ?? []);
  const [priority, setPriority] = useState<Priority>(task.priority ?? 'medium');
  const [col, setCol] = useState(task.col ?? 'todo');
  const isNew = !task.id;

  const toggleTag = (t: TagId) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  return (
    <ModalOverlay onClose={onClose}>
      <div data-part={P.kbModal}>
        <div data-part={P.kbModalHeader}>
          <span>{isNew ? 'New Task' : 'Edit Task'}</span>
          <Btn onClick={onClose} style={{ fontSize: 9 }}>
            ✕
          </Btn>
        </div>
        <div data-part={P.kbModalBody}>
          <div>
            <label>Title</label>
            <input
              data-part="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              data-part="field-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label>Column</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {columns.map((c) => (
                <Btn
                  key={c.id}
                  onClick={() => setCol(c.id)}
                  data-state={col === c.id ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {c.icon} {c.title}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Tags</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ALL_TAGS.map((key) => (
                <Btn
                  key={key}
                  onClick={() => toggleTag(key)}
                  data-state={tags.includes(key) ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {TAG_LABELS[key]}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Priority</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {ALL_PRIORITIES.map((key) => (
                <Btn
                  key={key}
                  onClick={() => setPriority(key)}
                  data-state={priority === key ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {PRIORITY_LABELS[key]}
                </Btn>
              ))}
            </div>
          </div>
        </div>
        <div data-part={P.kbModalFooter}>
          {!isNew && (
            <Btn
              onClick={() => {
                onDelete(task.id!);
                onClose();
              }}
              style={{ fontSize: 10 }}
            >
              Delete
            </Btn>
          )}
          <div style={{ flex: 1 }} />
          <Btn onClick={onClose} style={{ fontSize: 10 }}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              if (!title.trim()) return;
              onSave({
                id: task.id ?? mkId(),
                title,
                desc,
                tags,
                priority,
                col,
              });
              onClose();
            }}
            style={{ fontSize: 10, fontWeight: 'bold' }}
          >
            {isNew ? 'Create' : 'Save'}
          </Btn>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Props ────────────────────────────────────────────────────────────
export interface KanbanBoardProps {
  initialTasks?: Task[];
  initialColumns?: Column[];
  initialEditingTask?: Partial<Task> | null;
  initialFilterTag?: TagId | null;
  initialFilterPriority?: Priority | null;
  initialSearchQuery?: string;
  initialCollapsedCols?: Record<string, boolean>;
}

function createInitialSeed(props: KanbanBoardProps) {
  return createKanbanStateSeed({
    initialTasks: props.initialTasks ?? INITIAL_TASKS,
    initialColumns: props.initialColumns ?? INITIAL_COLUMNS,
    editingTask: props.initialEditingTask,
    filterTag: props.initialFilterTag,
    filterPriority: props.initialFilterPriority,
    searchQuery: props.initialSearchQuery,
    collapsedCols: props.initialCollapsedCols,
  });
}

export function KanbanBoardFrame({
  state,
  dispatch,
}: {
  state: KanbanState;
  dispatch: (action: KanbanAction) => void;
}) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const {
    tasks,
    columns,
    editingTask,
    filterTag,
    filterPriority,
    searchQuery,
    collapsedCols,
  } = state;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterTag && !t.tags.includes(filterTag)) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (
        searchQuery &&
        !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tasks, filterTag, filterPriority, searchQuery]);

  const tasksByCol = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const c of columns) m[c.id] = [];
    for (const t of filteredTasks) {
      if (m[t.col]) m[t.col].push(t);
    }
    return m;
  }, [filteredTasks, columns]);

  const totalByCol = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of columns) m[c.id] = tasks.filter((t) => t.col === c.id).length;
    return m;
  }, [tasks, columns]);

  const handleDrop = useCallback(
    (colId: string, e: React.DragEvent) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId) {
        dispatch(kanbanActions.moveTask({ id: taskId, col: colId }));
      }
      setDragOverCol(null);
    },
    [dispatch],
  );

  const handleSave = useCallback((task: Task) => {
    dispatch(kanbanActions.upsertTask(task));
  }, [dispatch]);

  const handleDelete = useCallback((id: string) => {
    dispatch(kanbanActions.deleteTask(id));
  }, [dispatch]);

  const toggleCollapse = (colId: string) =>
    dispatch(kanbanActions.toggleCollapsed(colId));

  const hasFilters = !!(filterTag || filterPriority || searchQuery);

  return (
    <div data-part={P.kb}>
      {/* ── Toolbar ── */}
      <WidgetToolbar>
        <Btn
          onClick={() => dispatch(kanbanActions.setEditingTask({ col: 'todo' }))}
          style={{ fontSize: 10, fontWeight: 'bold' }}
        >
          + New
        </Btn>

        <Separator />

        <input
          data-part="field-input"
          value={searchQuery}
          onChange={(e) => dispatch(kanbanActions.setSearchQuery(e.target.value))}
          placeholder="Search..."
          style={{ width: 120 }}
        />

        <Separator />

        {ALL_TAGS.map((key) => (
          <Btn
            key={key}
            onClick={() => dispatch(kanbanActions.setFilterTag(filterTag === key ? null : key))}
            data-state={filterTag === key ? 'active' : undefined}
            style={{ fontSize: 9, padding: '1px 5px' }}
          >
            {TAG_LABELS[key]}
          </Btn>
        ))}

        <Separator />

        {ALL_PRIORITIES.map((key) => (
          <Btn
            key={key}
            onClick={() => dispatch(
              kanbanActions.setFilterPriority(filterPriority === key ? null : key),
            )}
            data-state={filterPriority === key ? 'active' : undefined}
            style={{ fontSize: 9, padding: '1px 5px' }}
          >
            {PRIORITY_LABELS[key]}
          </Btn>
        ))}

        {hasFilters && (
          <Btn
            onClick={() => dispatch(kanbanActions.clearFilters())}
            style={{ fontSize: 9 }}
          >
            ✕ Clear
          </Btn>
        )}
      </WidgetToolbar>

      {/* ── Board ── */}
      <div data-part={P.kbBoard}>
        {columns.map((column) => {
          const colTasks = tasksByCol[column.id] || [];
          const total = totalByCol[column.id];
          const isOver = dragOverCol === column.id;
          const collapsed = collapsedCols[column.id];

          return (
            <div
              key={column.id}
              data-part={P.kbColumn}
              data-state={
                collapsed ? 'collapsed' : isOver ? 'drag-over' : undefined
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(column.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(column.id, e)}
            >
              <div
                data-part={P.kbColumnHeader}
                onClick={() => toggleCollapse(column.id)}
              >
                <span>
                  {column.icon} {column.title}
                </span>
                {!collapsed && (
                  <span data-part={P.kbColumnCount}>
                    {colTasks.length}
                    {colTasks.length !== total ? `/${total}` : ''}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(kanbanActions.setEditingTask({ col: column.id }));
                      }}
                      style={{ cursor: 'pointer', marginLeft: 6 }}
                    >
                      +
                    </span>
                  </span>
                )}
              </div>
              {!collapsed && (
                <div data-part={P.kbColumnCards}>
                  {colTasks.length === 0 && (
                    <div
                      style={{
                        padding: '20px 8px',
                        textAlign: 'center',
                        opacity: 0.4,
                        fontSize: 10,
                      }}
                    >
                      {isOver ? 'Drop here' : 'No tasks'}
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={(t) => dispatch(kanbanActions.setEditingTask(t))}
                      onDragStart={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Status Bar ── */}
      <WidgetStatusBar>
        <span>{tasks.length} total</span>
        <span>{tasks.filter((t) => t.priority === 'high').length} high</span>
        <span>{tasks.filter((t) => t.col === 'done').length} done</span>
        {hasFilters && <span>filtered</span>}
      </WidgetStatusBar>

      {/* ── Modal ── */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          columns={columns}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => dispatch(kanbanActions.setEditingTask(null))}
        />
      )}
    </div>
  );
}

function StandaloneKanbanBoard(props: KanbanBoardProps) {
  const [state, dispatch] = useReducer(kanbanReducer, createInitialSeed(props));

  return <KanbanBoardFrame state={state} dispatch={dispatch} />;
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
    props.initialFilterTag,
    props.initialSearchQuery,
    props.initialTasks,
    reduxDispatch,
  ]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  const dispatch = useCallback((action: KanbanAction) => {
    reduxDispatch(action);
  }, [reduxDispatch]);

  return <KanbanBoardFrame state={effectiveState} dispatch={dispatch} />;
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
