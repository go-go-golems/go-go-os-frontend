import { useCallback, useMemo, useState, type DragEvent } from 'react';
import { RICH_PARTS as P } from '../parts';
import { type KanbanPriorityId, type KanbanIssueTypeId, type Task } from './types';
import { KanbanHeaderBar } from './KanbanHeaderBar';
import { KanbanFilterBar } from './KanbanFilterBar';
import { KanbanLaneView } from './KanbanLaneView';
import { KanbanStatusBar, type KanbanStatusMetric } from './KanbanStatusBar';
import { KanbanTaskModal } from './KanbanTaskModal';
import type { KanbanState } from './kanbanState';

function filterTasks(tasks: Task[], filterType: KanbanIssueTypeId | null, filterPriority: KanbanPriorityId | null, searchQuery: string) {
  const normalizedQuery = searchQuery.toLowerCase();
  return tasks.filter((task) => {
    if (filterType && task.type !== filterType) {
      return false;
    }
    if (filterPriority && task.priority !== filterPriority) {
      return false;
    }
    if (
      normalizedQuery &&
      !task.title.toLowerCase().includes(normalizedQuery) &&
      !task.desc.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });
}

export interface KanbanBoardViewProps {
  state: KanbanState;
  onOpenTaskEditor: (task: Partial<Task>) => void;
  onCloseTaskEditor: () => void;
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (payload: { id: string; col: string }) => void;
  onSearchChange: (value: string) => void;
  onSetFilterType: (type: KanbanIssueTypeId | null) => void;
  onSetFilterPriority: (priority: KanbanPriorityId | null) => void;
  onClearFilters: () => void;
  onToggleCollapsed: (columnId: string) => void;
  defaultNewColumnId?: string;
  emptyColumnMessage?: string;
  dropHintMessage?: string;
  title?: string;
  subtitle?: string;
  primaryActionLabel?: string;
  showFilterBar?: boolean;
  statusMetrics?: KanbanStatusMetric[] | null;
  onPrimaryAction?: () => void;
}

export function KanbanBoardView({
  state,
  onOpenTaskEditor,
  onCloseTaskEditor,
  onSaveTask,
  onDeleteTask,
  onMoveTask,
  onSearchChange,
  onSetFilterType,
  onSetFilterPriority,
  onClearFilters,
  onToggleCollapsed,
  defaultNewColumnId,
  emptyColumnMessage = 'No tasks',
  dropHintMessage = 'Drop here',
  title = 'Kanban Board',
  subtitle = 'Host-composed board shell',
  primaryActionLabel = '+ New',
  showFilterBar = true,
  statusMetrics = null,
  onPrimaryAction,
}: KanbanBoardViewProps) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const {
    tasks,
    columns,
    taxonomy,
    editingTask,
    filterType,
    filterPriority,
    searchQuery,
    collapsedCols,
  } = state;

  const createTaskSeed = useCallback(
    (columnId?: string) => ({ col: columnId ?? defaultNewColumnId ?? columns[0]?.id ?? 'todo' }),
    [columns, defaultNewColumnId],
  );

  const filteredTasks = useMemo(
    () => filterTasks(tasks, filterType, filterPriority, searchQuery),
    [tasks, filterType, filterPriority, searchQuery],
  );

  const tasksByCol = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const column of columns) {
      grouped[column.id] = [];
    }
    for (const task of filteredTasks) {
      if (grouped[task.col]) {
        grouped[task.col].push(task);
      }
    }
    return grouped;
  }, [columns, filteredTasks]);

  const totalByCol = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const column of columns) {
      grouped[column.id] = tasks.filter((task) => task.col === column.id).length;
    }
    return grouped;
  }, [columns, tasks]);

  const handleDrop = useCallback((columnId: string, event: DragEvent) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask({ id: taskId, col: columnId });
    }
    setDragOverCol(null);
  }, [onMoveTask]);

  return (
    <div data-part={P.kb}>
      <KanbanHeaderBar
        title={title}
        subtitle={subtitle}
        searchQuery={searchQuery}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={onPrimaryAction ?? (() => onOpenTaskEditor(createTaskSeed()))}
        onSearchChange={onSearchChange}
      />

      {showFilterBar ? (
        <KanbanFilterBar
          taxonomy={taxonomy}
          filterType={filterType}
          filterPriority={filterPriority}
          searchQuery={searchQuery}
          onSetFilterType={onSetFilterType}
          onSetFilterPriority={onSetFilterPriority}
          onClearFilters={onClearFilters}
        />
      ) : null}

      <div data-part={P.kbBoard}>
        {columns.map((column) => {
          const colTasks = tasksByCol[column.id] || [];
          const total = totalByCol[column.id];
          const isOver = dragOverCol === column.id;
          const collapsed = collapsedCols[column.id];

          return (
            <KanbanLaneView
              key={column.id}
              column={column}
              taxonomy={taxonomy}
              tasks={colTasks}
              total={total}
              collapsed={collapsed}
              isDragOver={isOver}
              emptyColumnMessage={emptyColumnMessage}
              dropHintMessage={dropHintMessage}
              onOpenTaskEditor={(task) => onOpenTaskEditor({
                ...createTaskSeed(column.id),
                ...task,
              })}
              onToggleCollapsed={onToggleCollapsed}
              onDragOver={(columnId, event) => {
                event.preventDefault();
                setDragOverCol(columnId);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={handleDrop}
            />
          );
        })}
      </div>

      <KanbanStatusBar
        metrics={statusMetrics ?? [
          { label: 'total', value: tasks.length },
          { label: 'visible', value: filteredTasks.length },
          { label: 'done', value: tasks.filter((task) => task.col === 'done').length },
          ...(filterType || filterPriority || searchQuery ? [{ label: 'state', value: 'filtered' }] : []),
        ]}
      />

      {editingTask && (
        <KanbanTaskModal
          task={editingTask}
          columns={columns}
          taxonomy={taxonomy}
          onSave={onSaveTask}
          onDelete={onDeleteTask}
          onClose={onCloseTaskEditor}
        />
      )}
    </div>
  );
}
