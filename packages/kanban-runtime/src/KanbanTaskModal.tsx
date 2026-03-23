import { useEffect, useState } from 'react';
import { Btn } from '@hypercard/engine';
import { ModalOverlay } from '@hypercard/rich-widgets';
import type { Column, KanbanPriorityId, KanbanLabelId, KanbanTaxonomy, Task } from './types';
import { formatKanbanOption } from './types';
import { KANBAN_PARTS as P } from './parts';

let idSeq = 0;
const mkId = () => `task-${Date.now()}-${++idSeq}`;

export interface KanbanTaskModalProps {
  task: Partial<Task>;
  columns: Column[];
  taxonomy: KanbanTaxonomy;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function KanbanTaskModal({ task, columns, taxonomy, onSave, onDelete, onClose }: KanbanTaskModalProps) {
  const [title, setTitle] = useState(task.title ?? '');
  const [desc, setDesc] = useState(task.desc ?? '');
  const [type, setType] = useState(task.type ?? taxonomy.issueTypes[0]?.id ?? 'task');
  const [labels, setLabels] = useState<KanbanLabelId[]>(task.labels ?? []);
  const [priority, setPriority] = useState<KanbanPriorityId>(task.priority ?? taxonomy.priorities[1]?.id ?? taxonomy.priorities[0]?.id ?? 'medium');
  const [col, setCol] = useState(task.col ?? columns[0]?.id ?? 'todo');
  const isNew = !task.id;

  useEffect(() => {
    setTitle(task.title ?? '');
    setDesc(task.desc ?? '');
    setType(task.type ?? taxonomy.issueTypes[0]?.id ?? 'task');
    setLabels(task.labels ?? []);
    setPriority(task.priority ?? taxonomy.priorities[1]?.id ?? taxonomy.priorities[0]?.id ?? 'medium');
    setCol(task.col ?? columns[0]?.id ?? 'todo');
  }, [columns, task, taxonomy]);

  const toggleLabel = (labelId: KanbanLabelId) => {
    setLabels((previous) => (
      previous.includes(labelId)
        ? previous.filter((entry) => entry !== labelId)
        : [...previous, labelId]
    ));
  };

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
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              data-part="field-input"
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label>Column</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {columns.map((column) => (
                <Btn
                  key={column.id}
                  onClick={() => setCol(column.id)}
                  data-state={col === column.id ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {column.icon} {column.title}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Issue Type</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {taxonomy.issueTypes.map((issueType) => (
                <Btn
                  key={issueType.id}
                  onClick={() => setType(issueType.id)}
                  data-state={type === issueType.id ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {formatKanbanOption(issueType, issueType.id)}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Labels</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {taxonomy.labels.map((label) => (
                <Btn
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  data-state={labels.includes(label.id) ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {formatKanbanOption(label, label.id)}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label>Priority</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {taxonomy.priorities.map((entry) => (
                <Btn
                  key={entry.id}
                  onClick={() => setPriority(entry.id)}
                  data-state={priority === entry.id ? 'active' : undefined}
                  style={{ fontSize: 10 }}
                >
                  {formatKanbanOption(entry, entry.id)}
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
              if (!title.trim()) {
                return;
              }

              onSave({
                id: task.id ?? mkId(),
                title,
                desc,
                type,
                labels,
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
