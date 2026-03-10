import type { KanbanTaxonomy, Task } from './types';
import { RICH_PARTS as P } from '../parts';
import { findKanbanOption, formatKanbanOption } from './types';

export interface KanbanTaskCardProps {
  task: Task;
  taxonomy: KanbanTaxonomy;
  onEdit: (task: Task) => void;
  onDragStart?: (id: string) => void;
}

export function KanbanTaskCard({ task, taxonomy, onEdit, onDragStart }: KanbanTaskCardProps) {
  const issueType = findKanbanOption(taxonomy.issueTypes, task.type);

  return (
    <div
      data-part={P.kbCard}
      data-priority={task.priority}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        onDragStart?.(task.id);
      }}
      onClick={() => onEdit(task)}
    >
      <div data-part={P.kbCardTitle}>{task.title}</div>
      <div data-part={P.kbCardTags}>
        <span data-part={P.kbTag} data-tag={task.type}>
          {formatKanbanOption(issueType, task.type)}
        </span>
      </div>
      {task.desc && <div data-part={P.kbCardDesc}>{task.desc}</div>}
      {task.labels.length > 0 && (
        <div data-part={P.kbCardTags}>
          {task.labels.map((labelId) => {
            const label = findKanbanOption(taxonomy.labels, labelId);
            return (
              <span key={labelId} data-part={P.kbTag} data-tag={labelId}>
                {formatKanbanOption(label, labelId)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
