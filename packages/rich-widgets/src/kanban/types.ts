export type KanbanIssueTypeId = string;
export type KanbanPriorityId = string;
export type KanbanLabelId = string;

export interface KanbanOptionDescriptor {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface KanbanTaxonomy {
  issueTypes: KanbanOptionDescriptor[];
  priorities: KanbanOptionDescriptor[];
  labels: KanbanOptionDescriptor[];
}

export interface Task {
  id: string;
  col: string;
  title: string;
  type: KanbanIssueTypeId;
  labels: KanbanLabelId[];
  priority: KanbanPriorityId;
  desc: string;
}

export interface Column {
  id: string;
  title: string;
  icon: string;
}

export interface KanbanHighlight {
  id: string;
  label: string;
  value: string | number;
  caption?: string;
  progress?: number;
  trend?: number[];
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}

export const DEFAULT_KANBAN_TAXONOMY: KanbanTaxonomy = {
  issueTypes: [
    { id: 'bug', label: 'Bug', icon: '🐞', color: '#f28b82' },
    { id: 'feature', label: 'Feature', icon: '✨', color: '#8ab4f8' },
    { id: 'task', label: 'Task', icon: '🧩', color: '#81c995' },
  ],
  priorities: [
    { id: 'high', label: 'High', icon: '▲', color: '#f28b82' },
    { id: 'medium', label: 'Medium', icon: '●', color: '#fdd663' },
    { id: 'low', label: 'Low', icon: '▽', color: '#81c995' },
  ],
  labels: [
    { id: 'urgent', label: 'Urgent', icon: '🔥', color: '#f28b82' },
    { id: 'design', label: 'Design', icon: '🎨', color: '#fbbc04' },
    { id: 'docs', label: 'Docs', icon: '📚', color: '#a7ff83' },
    { id: 'backend', label: 'Backend', icon: '🛠️', color: '#8ab4f8' },
    { id: 'frontend', label: 'Frontend', icon: '🖼️', color: '#ccadff' },
  ],
};

export function cloneKanbanOption(option: KanbanOptionDescriptor): KanbanOptionDescriptor {
  return { ...option };
}

export function cloneKanbanTaxonomy(taxonomy: KanbanTaxonomy): KanbanTaxonomy {
  return {
    issueTypes: taxonomy.issueTypes.map(cloneKanbanOption),
    priorities: taxonomy.priorities.map(cloneKanbanOption),
    labels: taxonomy.labels.map(cloneKanbanOption),
  };
}

export function normalizeKanbanTaxonomy(taxonomy?: Partial<KanbanTaxonomy> | null): KanbanTaxonomy {
  return {
    issueTypes: (taxonomy?.issueTypes?.length ? taxonomy.issueTypes : DEFAULT_KANBAN_TAXONOMY.issueTypes).map(cloneKanbanOption),
    priorities: (taxonomy?.priorities?.length ? taxonomy.priorities : DEFAULT_KANBAN_TAXONOMY.priorities).map(cloneKanbanOption),
    labels: (taxonomy?.labels?.length ? taxonomy.labels : DEFAULT_KANBAN_TAXONOMY.labels).map(cloneKanbanOption),
  };
}

export function findKanbanOption(options: KanbanOptionDescriptor[], id: string | null | undefined) {
  if (!id) {
    return undefined;
  }

  return options.find((option) => option.id === id);
}

export function formatKanbanOption(option: KanbanOptionDescriptor | undefined, fallbackId: string) {
  if (!option) {
    return fallbackId;
  }

  return option.icon ? `${option.icon} ${option.label}` : option.label;
}
