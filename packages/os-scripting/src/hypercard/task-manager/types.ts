export interface TaskManagerAction {
  id: string;
  label: string;
  intent: 'open' | 'focus' | 'inspect' | 'reset' | 'dispose' | 'terminate' | 'custom';
}

export interface TaskManagerRow {
  id: string;
  kind: string;
  sourceId: string;
  sourceTitle: string;
  title: string;
  status: string;
  startedAt?: string;
  updatedAt?: string;
  tags?: string[];
  details?: Record<string, string>;
  actions: TaskManagerAction[];
}

export interface TaskManagerSource {
  sourceId(): string;
  title(): string;
  listRows(): TaskManagerRow[];
  invoke(actionId: string, rowId: string): Promise<void> | void;
  subscribe(listener: () => void): () => void;
}
