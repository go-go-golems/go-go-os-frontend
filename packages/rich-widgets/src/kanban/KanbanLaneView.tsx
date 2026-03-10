import type { DragEvent } from 'react';
import { RICH_PARTS as P } from '../parts';
import type { Column, KanbanTaxonomy, Task } from './types';
import { KanbanTaskCard } from './KanbanTaskCard';

export interface KanbanLaneViewProps {
  column: Column;
  taxonomy: KanbanTaxonomy;
  tasks: Task[];
  total: number;
  collapsed: boolean;
  isDragOver: boolean;
  emptyColumnMessage?: string;
  dropHintMessage?: string;
  onOpenTaskEditor: (task: Partial<Task>) => void;
  onToggleCollapsed: (columnId: string) => void;
  onDragOver: (columnId: string, event: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (columnId: string, event: DragEvent) => void;
}

export function KanbanLaneView({
  column,
  taxonomy,
  tasks,
  total,
  collapsed,
  isDragOver,
  emptyColumnMessage = 'No tasks',
  dropHintMessage = 'Drop here',
  onOpenTaskEditor,
  onToggleCollapsed,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanLaneViewProps) {
  return (
    <div
      data-part={P.kbColumn}
      data-state={collapsed ? 'collapsed' : isDragOver ? 'drag-over' : undefined}
      onDragOver={(event) => onDragOver(column.id, event)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(column.id, event)}
    >
      <div
        data-part={P.kbColumnHeader}
        onClick={() => onToggleCollapsed(column.id)}
      >
        <span>
          {column.icon} {column.title}
        </span>
        {!collapsed ? (
          <span data-part={P.kbColumnCount}>
            {tasks.length}
            {tasks.length !== total ? `/${total}` : ''}
            <span
              onClick={(event) => {
                event.stopPropagation();
                onOpenTaskEditor({ col: column.id });
              }}
              style={{ cursor: 'pointer', marginLeft: 6 }}
            >
              +
            </span>
          </span>
        ) : null}
      </div>

      {!collapsed ? (
        <div data-part={P.kbColumnCards}>
          {tasks.length === 0 ? (
            <div
              style={{
                padding: '20px 8px',
                textAlign: 'center',
                opacity: 0.4,
                fontSize: 10,
              }}
            >
              {isDragOver ? dropHintMessage : emptyColumnMessage}
            </div>
          ) : null}

          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              taxonomy={taxonomy}
              onEdit={onOpenTaskEditor}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
