import { useState, useMemo, useCallback } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { Task, Column, TagId, Priority } from './types';
import { TAG_LABELS, PRIORITY_LABELS, ALL_TAGS, ALL_PRIORITIES } from './types';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';

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
      data-part={RICH_PARTS.kanbanCard}
      data-priority={task.priority}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        onDragStart(task.id);
      }}
      onClick={() => onEdit(task)}
    >
      <div data-part={RICH_PARTS.kanbanCardTitle}>{task.title}</div>
      {task.desc && (
        <div data-part={RICH_PARTS.kanbanCardDesc}>{task.desc}</div>
      )}
      {task.tags.length > 0 && (
        <div data-part={RICH_PARTS.kanbanCardTags}>
          {task.tags.map((t) => (
            <span key={t} data-part={RICH_PARTS.kanbanTag} data-tag={t}>
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
    <div data-part={RICH_PARTS.kanbanModalOverlay} onClick={onClose}>
      <div
        data-part={RICH_PARTS.kanbanModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div data-part={RICH_PARTS.kanbanModalHeader}>
          <span>{isNew ? 'New Task' : 'Edit Task'}</span>
          <Btn onClick={onClose} style={{ fontSize: 9 }}>
            ✕
          </Btn>
        </div>
        <div data-part={RICH_PARTS.kanbanModalBody}>
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
        <div data-part={RICH_PARTS.kanbanModalFooter}>
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
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────
export interface KanbanBoardProps {
  initialTasks?: Task[];
  initialColumns?: Column[];
}

// ── Component ────────────────────────────────────────────────────────
export function KanbanBoard({
  initialTasks = INITIAL_TASKS,
  initialColumns = INITIAL_COLUMNS,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [columns] = useState(initialColumns);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [filterTag, setFilterTag] = useState<TagId | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>(
    {},
  );

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
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, col: colId } : t)),
        );
      }
      setDragOverCol(null);
    },
    [],
  );

  const handleSave = useCallback((task: Task) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id);
      if (exists) return prev.map((t) => (t.id === task.id ? task : t));
      return [...prev, task];
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleCollapse = (colId: string) =>
    setCollapsedCols((prev) => ({ ...prev, [colId]: !prev[colId] }));

  const hasFilters = !!(filterTag || filterPriority || searchQuery);

  return (
    <div data-part={RICH_PARTS.kanban}>
      {/* ── Toolbar ── */}
      <div data-part={RICH_PARTS.kanbanToolbar}>
        <Btn
          onClick={() => setEditingTask({ col: 'todo' })}
          style={{ fontSize: 10, fontWeight: 'bold' }}
        >
          + New
        </Btn>

        <span data-part={RICH_PARTS.kanbanSeparator} />

        <input
          data-part="field-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          style={{ width: 120 }}
        />

        <span data-part={RICH_PARTS.kanbanSeparator} />

        {ALL_TAGS.map((key) => (
          <Btn
            key={key}
            onClick={() => setFilterTag((prev) => (prev === key ? null : key))}
            data-state={filterTag === key ? 'active' : undefined}
            style={{ fontSize: 9, padding: '1px 5px' }}
          >
            {TAG_LABELS[key]}
          </Btn>
        ))}

        <span data-part={RICH_PARTS.kanbanSeparator} />

        {ALL_PRIORITIES.map((key) => (
          <Btn
            key={key}
            onClick={() =>
              setFilterPriority((prev) => (prev === key ? null : key))
            }
            data-state={filterPriority === key ? 'active' : undefined}
            style={{ fontSize: 9, padding: '1px 5px' }}
          >
            {PRIORITY_LABELS[key]}
          </Btn>
        ))}

        {hasFilters && (
          <Btn
            onClick={() => {
              setFilterTag(null);
              setFilterPriority(null);
              setSearchQuery('');
            }}
            style={{ fontSize: 9 }}
          >
            ✕ Clear
          </Btn>
        )}
      </div>

      {/* ── Board ── */}
      <div data-part={RICH_PARTS.kanbanBoard}>
        {columns.map((column) => {
          const colTasks = tasksByCol[column.id] || [];
          const total = totalByCol[column.id];
          const isOver = dragOverCol === column.id;
          const collapsed = collapsedCols[column.id];

          return (
            <div
              key={column.id}
              data-part={RICH_PARTS.kanbanColumn}
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
                data-part={RICH_PARTS.kanbanColumnHeader}
                onClick={() => toggleCollapse(column.id)}
              >
                <span>
                  {column.icon} {column.title}
                </span>
                {!collapsed && (
                  <span data-part={RICH_PARTS.kanbanColumnCount}>
                    {colTasks.length}
                    {colTasks.length !== total ? `/${total}` : ''}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask({ col: column.id });
                      }}
                      style={{ cursor: 'pointer', marginLeft: 6 }}
                    >
                      +
                    </span>
                  </span>
                )}
              </div>
              {!collapsed && (
                <div data-part={RICH_PARTS.kanbanColumnCards}>
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
                      onEdit={(t) => setEditingTask(t)}
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
      <div data-part={RICH_PARTS.kanbanStatusBar}>
        <span>{tasks.length} total</span>
        <span>{tasks.filter((t) => t.priority === 'high').length} high</span>
        <span>{tasks.filter((t) => t.col === 'done').length} done</span>
        {hasFilters && <span>filtered</span>}
      </div>

      {/* ── Modal ── */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          columns={columns}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
