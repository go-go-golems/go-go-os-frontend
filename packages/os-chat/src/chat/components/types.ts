export type ChatMessageStatus = 'complete' | 'streaming' | 'error';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  status?: ChatMessageStatus;
  results?: unknown[];
  actions?: Array<{ label: string; action: unknown }>;
  meta?: Record<string, unknown>;
}
