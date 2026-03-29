export type ConfirmWidgetType = 'confirm' | 'select' | 'form' | 'upload' | 'table' | 'image' | 'script';
export type ConfirmRequestStatus = 'pending' | 'completed' | 'timeout' | 'error' | 'unknown';

export interface ConfirmWidgetInput {
  title?: string;
  payload?: Record<string, unknown>;
}

export interface ConfirmScriptView {
  widgetType: string;
  stepId?: string;
  title?: string;
  description?: string;
  input: Record<string, unknown>;
  sections?: Array<{
    id: string;
    kind: 'display' | 'interactive';
    title?: string;
    widgetType?: string;
    input?: Record<string, unknown>;
  }>;
  allowBack?: boolean;
  backLabel?: string;
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  toast?: {
    message: string;
    style?: 'info' | 'success' | 'warning' | 'error';
    durationMs?: number;
  };
}

export interface ConfirmRequest {
  id: string;
  sessionId: string;
  widgetType: ConfirmWidgetType;
  status?: ConfirmRequestStatus;
  title?: string;
  message?: string;
  createdAt?: string;
  completedAt?: string;
  updatedAt?: string;
  input?: ConfirmWidgetInput;
  scriptView?: ConfirmScriptView;
  metadata?: Record<string, unknown>;
}

export interface ConfirmRequestCompletion {
  requestId: string;
  completedAt: string;
  output?: Record<string, unknown>;
}

export type ConfirmEventType = 'new_request' | 'request_updated' | 'request_completed';

export interface ConfirmRealtimeEvent {
  type: ConfirmEventType;
  request?: ConfirmRequest;
  requestId?: string;
  completedAt?: string;
  output?: Record<string, unknown>;
}

export interface SubmitResponsePayload {
  output: Record<string, unknown>;
}

export interface SubmitScriptEventPayload {
  type: string;
  stepId?: string;
  actionId?: string;
  data?: Record<string, unknown>;
}

export interface ConfirmApiClient {
  getRequest(requestId: string): Promise<ConfirmRequest>;
  submitResponse(request: ConfirmRequest, payload: SubmitResponsePayload): Promise<ConfirmRequest | null>;
  submitScriptEvent(requestId: string, payload: SubmitScriptEventPayload): Promise<ConfirmRequest | null>;
  touchRequest(requestId: string): Promise<void>;
}
