import type {
  ConfirmRealtimeEvent,
  ConfirmRequest,
  ConfirmRequestStatus,
  ConfirmScriptView,
  ConfirmWidgetType,
  SubmitResponsePayload,
} from '../types';

type RawRecord = Record<string, unknown>;

const KNOWN_WIDGET_TYPES: ConfirmWidgetType[] = ['confirm', 'select', 'form', 'upload', 'table', 'image', 'script'];

function asRecord(value: unknown): RawRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as RawRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeWidgetType(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
}

function isWidgetType(value: unknown): value is ConfirmWidgetType {
  return typeof value === 'string' && KNOWN_WIDGET_TYPES.includes(value as ConfirmWidgetType);
}

function mapRequestStatus(value: unknown): ConfirmRequestStatus {
  if (value === 'pending' || value === 'completed' || value === 'timeout' || value === 'error') {
    return value;
  }
  if (value === 'expired') {
    return 'timeout';
  }
  return 'unknown';
}

function inputFieldForWidgetType(widgetType: ConfirmWidgetType): string {
  switch (widgetType) {
    case 'confirm':
      return 'confirmInput';
    case 'select':
      return 'selectInput';
    case 'form':
      return 'formInput';
    case 'upload':
      return 'uploadInput';
    case 'table':
      return 'tableInput';
    case 'image':
      return 'imageInput';
    case 'script':
      return 'scriptInput';
  }
}

function normalizeUploadInput(rawInput: RawRecord): RawRecord {
  const maxSize = asNumber(rawInput.maxSize);
  if (maxSize === undefined) {
    return rawInput;
  }
  return {
    ...rawInput,
    maxSize,
  };
}

function normalizeInputPayload(widgetType: ConfirmWidgetType, rawInput: RawRecord): RawRecord {
  if (widgetType === 'upload') {
    return normalizeUploadInput(rawInput);
  }
  return rawInput;
}

function mapScriptView(raw: unknown): ConfirmScriptView | undefined {
  const view = asRecord(raw);
  if (!view) {
    return undefined;
  }

  const widgetType = normalizeWidgetType(view.widgetType) ?? 'confirm';
  const sections = Array.isArray(view.sections)
    ? view.sections
        .map((section, index) => {
          const row = asRecord(section);
          if (!row) {
            return null;
          }
          const sectionWidgetType = normalizeWidgetType(row.widgetType);
          const rawKind = normalizeWidgetType(row.kind);
          const kind: 'display' | 'interactive' =
            rawKind === 'display' || sectionWidgetType === 'display' ? 'display' : 'interactive';
          return {
            id: `section-${index}`,
            kind,
            title: asString(row.title),
            widgetType: sectionWidgetType,
            input: asRecord(row.input) ?? undefined,
          };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : undefined;

  const progress = asRecord(view.progress);
  const toast = asRecord(view.toast);

  return {
    widgetType,
    stepId: asString(view.stepId),
    title: asString(view.title),
    description: asString(view.description),
    input: asRecord(view.input) ?? {},
    sections,
    allowBack: view.allowBack === true,
    backLabel: asString(view.backLabel),
    progress: progress
      ? {
          current: typeof progress.current === 'number' ? progress.current : 0,
          total: typeof progress.total === 'number' ? progress.total : 0,
          label: asString(progress.label),
        }
      : undefined,
    toast: toast
      ? {
          message: asString(toast.message) ?? '',
          style:
            toast.style === 'info' || toast.style === 'success' || toast.style === 'warning' || toast.style === 'error'
              ? toast.style
              : undefined,
          durationMs: typeof toast.durationMs === 'number' ? toast.durationMs : undefined,
        }
      : undefined,
  };
}

export function mapUIRequestFromProto(raw: unknown): ConfirmRequest | null {
  const request = asRecord(raw);
  if (!request) {
    return null;
  }
  const requestId = asString(request.id);
  const sessionId = asString(request.sessionId);
  const widgetType = request.type;

  if (!requestId || !sessionId || !isWidgetType(widgetType)) {
    return null;
  }

  const inputField = inputFieldForWidgetType(widgetType);
  const rawInput = asRecord(request[inputField]) ?? {};
  const normalizedInput = normalizeInputPayload(widgetType, rawInput);
  const title = asString(rawInput.title);
  const message = asString(rawInput.message);
  const scriptView = mapScriptView(request.scriptView);

  return {
    id: requestId,
    sessionId,
    widgetType,
    status: mapRequestStatus(request.status),
    title: title ?? scriptView?.title,
    message,
    createdAt: asString(request.createdAt),
    completedAt: asString(request.completedAt),
    updatedAt: asString(request.updatedAt),
    input: {
      title,
      payload: normalizedInput,
    },
    scriptView,
    metadata: asRecord(request.metadata) ?? undefined,
  };
}

function mapEventType(raw: unknown): ConfirmRealtimeEvent['type'] | null {
  if (raw === 'new_request' || raw === 'request_updated' || raw === 'request_completed') {
    return raw;
  }
  return null;
}

const OUTPUT_FIELDS = [
  'confirmOutput',
  'selectOutput',
  'formOutput',
  'uploadOutput',
  'tableOutput',
  'imageOutput',
  'scriptOutput',
] as const;

function extractOutputPayload(requestRecord: RawRecord | null): RawRecord | undefined {
  if (!requestRecord) {
    return undefined;
  }
  for (const field of OUTPUT_FIELDS) {
    const payload = asRecord(requestRecord[field]);
    if (payload) {
      return payload;
    }
  }
  return undefined;
}

export function mapRealtimeEventFromProto(raw: unknown): ConfirmRealtimeEvent | null {
  const event = asRecord(raw);
  if (!event) {
    return null;
  }

  const type = mapEventType(event.type);
  if (!type) {
    return null;
  }
  const request = mapUIRequestFromProto(event.request);
  const requestRecord = asRecord(event.request);
  const output = asRecord(event.output) ?? extractOutputPayload(requestRecord);

  return {
    type,
    request: request ?? undefined,
    requestId: asString(event.requestId) ?? request?.id,
    completedAt: asString(event.completedAt) ?? asString(requestRecord?.completedAt),
    output,
  };
}

function commentField(output: RawRecord): RawRecord {
  const comment = asString(output.comment);
  return comment ? { comment } : {};
}

function mapConfirmResponse(output: RawRecord): RawRecord {
  const timestamp = asString(output.timestamp) ?? new Date().toISOString();
  return {
    confirmOutput: {
      approved: output.approved === true,
      timestamp,
      ...commentField(output),
    },
  };
}

function mapSelectResponse(request: ConfirmRequest, output: RawRecord): RawRecord {
  const payload = asRecord(request.input?.payload) ?? {};
  const multi = payload.multi === true;
  const selectedMulti = asRecord(output.selectedMulti);
  const selected = selectedMulti
    ? asStringArray(selectedMulti.values)
    : typeof output.selectedSingle === 'string'
      ? [output.selectedSingle]
      : asStringArray(output.selectedIds);

  if (multi) {
    return {
      selectOutput: {
        selectedMulti: { values: selected },
        ...commentField(output),
      },
    };
  }
  return {
    selectOutput: {
      selectedSingle: selected[0] ?? '',
      ...commentField(output),
    },
  };
}

function mapFormResponse(output: RawRecord): RawRecord {
  const data = asRecord(output.value) ?? asRecord(output.data) ?? output;
  return {
    formOutput: {
      data,
      ...commentField(output),
    },
  };
}

function mapTableResponse(request: ConfirmRequest, output: RawRecord): RawRecord {
  const payload = asRecord(request.input?.payload) ?? {};
  const multi = payload.multiSelect === true;
  const selectedRowsRaw = output.selectedRows;
  const selectedRows = Array.isArray(selectedRowsRaw)
    ? selectedRowsRaw.map((row) => asRecord(row)).filter((row): row is RawRecord => row !== null)
    : [];

  if (selectedRows.length > 0) {
    if (multi) {
      return {
        tableOutput: {
          selectedMulti: { values: selectedRows },
          ...commentField(output),
        },
      };
    }
    return {
      tableOutput: {
        selectedSingle: selectedRows[0],
        ...commentField(output),
      },
    };
  }

  const keys = asStringArray(output.selectedRowKeys);
  const keyRows = keys.map((id) => ({ id }));
  if (multi) {
    return {
      tableOutput: {
        selectedMulti: { values: keyRows },
        ...commentField(output),
      },
    };
  }
  return {
    tableOutput: {
      selectedSingle: keyRows[0] ?? { id: '' },
      ...commentField(output),
    },
  };
}

function mapImageResponse(request: ConfirmRequest, output: RawRecord): RawRecord {
  const timestamp = asString(output.timestamp) ?? new Date().toISOString();
  if (typeof output.selectedBool === 'boolean') {
    return {
      imageOutput: {
        selectedBool: output.selectedBool,
        timestamp,
        ...commentField(output),
      },
    };
  }

  if (typeof output.selectedString === 'string') {
    return {
      imageOutput: {
        selectedString: output.selectedString,
        timestamp,
        ...commentField(output),
      },
    };
  }

  const selectedStrings = asRecord(output.selectedStrings);
  if (selectedStrings) {
    const values = asStringArray(selectedStrings.values);
    if (values.length > 0) {
      return {
        imageOutput: {
          selectedStrings: { values },
          timestamp,
          ...commentField(output),
        },
      };
    }
  }

  const payload = asRecord(request.input?.payload) ?? {};
  const multi = payload.multi === true;
  const selected = asStringArray(output.selectedImageIds);
  if (multi) {
    return {
      imageOutput: {
        selectedStrings: { values: selected },
        timestamp,
        ...commentField(output),
      },
    };
  }
  return {
    imageOutput: {
      selectedString: selected[0] ?? '',
      timestamp,
      ...commentField(output),
    },
  };
}

function mapUploadResponse(output: RawRecord): RawRecord {
  const files = Array.isArray(output.files)
    ? output.files
        .map((entry) => asRecord(entry))
        .filter((entry): entry is RawRecord => entry !== null)
        .map((entry) => ({
          name: asString(entry.name) ?? '',
          size: typeof entry.size === 'number' ? entry.size : 0,
          path: asString(entry.path) ?? '',
          mimeType: asString(entry.mimeType) ?? '',
        }))
    : [];

  return {
    uploadOutput: {
      files,
      ...commentField(output),
    },
  };
}

export function mapSubmitResponseToProto(request: ConfirmRequest, payload: SubmitResponsePayload): RawRecord {
  const output = asRecord(payload.output) ?? {};
  switch (request.widgetType) {
    case 'confirm':
      return mapConfirmResponse(output);
    case 'select':
      return mapSelectResponse(request, output);
    case 'form':
      return mapFormResponse(output);
    case 'table':
      return mapTableResponse(request, output);
    case 'image':
      return mapImageResponse(request, output);
    case 'upload':
      return mapUploadResponse(output);
    case 'script':
      return { scriptOutput: asRecord(output) ?? {} };
  }
}
