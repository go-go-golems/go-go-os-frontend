import {
  DataTable,
  FilePickerDropzone,
  GridBoard,
  ImageChoiceGrid,
  RatingPicker,
  RequestActionBar,
  SchemaFormRenderer,
  SelectableDataTable,
  SelectableList,
  type ColumnConfig,
} from '@go-go-golems/os-core';
import { useEffect, useState } from 'react';
import type { ConfirmRequest, ConfirmScriptView, SubmitResponsePayload, SubmitScriptEventPayload } from '../types';
import type { JsonSchemaNode } from '@go-go-golems/os-core';

export interface ConfirmRequestWindowHostProps {
  request: ConfirmRequest;
  onSubmitResponse: (requestId: string, payload: SubmitResponsePayload) => void;
  onSubmitScriptEvent: (requestId: string, payload: SubmitScriptEventPayload) => void;
}

function renderPlaceholder(message: string) {
  return <div data-part="table-empty">{message}</div>;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeWidgetType(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
}

function normalizeComment(comment: string | undefined): string | undefined {
  const trimmed = comment?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function parseSelectOptions(payload: Record<string, unknown>) {
  const options = payload.options;
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option, index) => {
    if (typeof option === 'string') {
      return { id: option, label: option };
    }
    if (typeof option === 'object' && option !== null) {
      const row = option as Record<string, unknown>;
      return {
        id: String(row.value ?? row.id ?? `opt-${index}`),
        label: String(row.label ?? row.title ?? row.value ?? `Option ${index + 1}`),
        description: typeof row.description === 'string' ? row.description : undefined,
        meta: typeof row.meta === 'string' ? row.meta : undefined,
      };
    }
    return { id: `opt-${index}`, label: String(option) };
  });
}

function parseTableRows(payload: Record<string, unknown>): Array<Record<string, unknown>> {
  const rows = Array.isArray(payload.rows) ? payload.rows : Array.isArray(payload.data) ? payload.data : [];
  return rows.filter((row) => typeof row === 'object' && row !== null) as Array<Record<string, unknown>>;
}

function parseTableColumns(
  payload: Record<string, unknown>,
  tableRows: Array<Record<string, unknown>>,
): ColumnConfig<Record<string, unknown>>[] {
  if (Array.isArray(payload.columns) && payload.columns.length > 0) {
    return payload.columns
      .map((entry) => (typeof entry === 'string' ? { key: entry, label: entry } : entry))
      .filter((entry): entry is ColumnConfig<Record<string, unknown>> => typeof entry === 'object' && entry !== null)
      .map((entry) => ({ key: String(entry.key), label: String(entry.label ?? entry.key) }));
  }

  if (tableRows.length > 0) {
    return Object.keys(tableRows[0]).map((key) => ({ key, label: key }));
  }
  return [];
}

function resolveTableRowId(row: Record<string, unknown>, index: number, rowKey?: string): string {
  if (rowKey) {
    return String(row[rowKey]);
  }
  return String(row.id ?? index);
}

export function resolveSelectedTableRows(
  rows: Array<Record<string, unknown>>,
  selectedRowKeys: string[],
  rowKey?: string,
): Array<Record<string, unknown>> {
  const selected = new Set(selectedRowKeys);
  return rows.filter((row, index) => selected.has(resolveTableRowId(row, index, rowKey)));
}

export function buildRequestActionBarKey(
  requestId: string,
  stepKey: string,
  widgetType: string,
  mode: 'response' | 'script',
): string {
  return `${requestId}:${mode}:${stepKey || 'root'}:${widgetType}`;
}

type ScriptSectionKind = Pick<NonNullable<ConfirmScriptView['sections']>[number], 'kind' | 'widgetType'>;

export function resolveScriptSectionType(section: ScriptSectionKind): string {
  return normalizeWidgetType(section.widgetType ?? section.kind);
}

export function isInteractiveScriptSection(section: ScriptSectionKind): boolean {
  return resolveScriptSectionType(section) !== 'display';
}

function parseImageItems(payload: Record<string, unknown>): Array<{ id: string; src: string; label?: string; badge?: string }> {
  const images = payload.images;
  if (!Array.isArray(images)) {
    return [];
  }

  const rows: Array<{ id: string; src: string; label?: string; badge?: string }> = [];
  images.forEach((entry, index) => {
    if (typeof entry === 'string') {
      rows.push({ id: `img-${index}`, src: entry, label: `Image ${index + 1}` });
      return;
    }
    if (typeof entry !== 'object' || entry === null) {
      return;
    }
    const row = entry as Record<string, unknown>;
    if (typeof row.src !== 'string') {
      return;
    }
    rows.push({
      id: String(row.id ?? `img-${index}`),
      src: row.src,
      label: typeof row.label === 'string' ? row.label : undefined,
      badge: typeof row.badge === 'string' ? row.badge : undefined,
    });
  });

  return rows;
}

function ScriptDisplaySection({ payload }: { payload: Record<string, unknown> }) {
  const title = asString(payload.title);
  const content = asString(payload.content) ?? '';

  return (
    <div data-part="confirm-display">
      {title && <div data-part="confirm-display-title">{title}</div>}
      <pre data-part="confirm-display-content">{content}</pre>
    </div>
  );
}

export function ConfirmRequestWindowHost({ request, onSubmitResponse, onSubmitScriptEvent }: ConfirmRequestWindowHostProps) {
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [selectedTableRows, setSelectedTableRows] = useState<string[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedGridCell, setSelectedGridCell] = useState<{ row: number; col: number; cellIndex: number } | null>(null);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<
    Array<{ name: string; size: number; path: string; mimeType: string }>
  >([]);

  const scriptStepKey = request.widgetType === 'script' ? request.scriptView?.stepId ?? request.scriptView?.widgetType ?? '' : '';
  useEffect(() => {
    setSelectedListIds([]);
    setSelectedTableRows([]);
    setSelectedImageIds([]);
    setSelectedRating(null);
    setSelectedGridCell(null);
    setSelectedUploadFiles([]);
  }, [request.id, scriptStepKey]);

  const submitResponse = (output: Record<string, unknown>) => {
    onSubmitResponse(request.id, { output });
  };

  const submitScript = (output: Record<string, unknown>) => {
    onSubmitScriptEvent(request.id, {
      type: 'submit',
      stepId: request.scriptView?.stepId,
      data: output,
    });
  };

  const submitBack = () => {
    onSubmitScriptEvent(request.id, {
      type: 'back',
      stepId: request.scriptView?.stepId,
    });
  };

  const emitSubmit = (mode: 'response' | 'script', output: Record<string, unknown>) => {
    if (mode === 'script') {
      submitScript(output);
      return;
    }
    submitResponse(output);
  };

  const renderWidget = (widgetType: string, payload: Record<string, unknown>, mode: 'response' | 'script') => {
    const actionBarKey = buildRequestActionBarKey(request.id, mode === 'script' ? scriptStepKey : '', widgetType, mode);

    if (widgetType === 'confirm') {
      return (
        <RequestActionBar
          key={actionBarKey}
          primaryLabel={typeof payload.approveText === 'string' ? payload.approveText : 'Approve'}
          secondaryLabel={typeof payload.rejectText === 'string' ? payload.rejectText : 'Reject'}
          commentEnabled
          onPrimary={(comment) =>
            emitSubmit(mode, {
              approved: true,
              ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
            })
          }
          onSecondary={(comment) =>
            emitSubmit(mode, {
              approved: false,
              ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
            })
          }
        />
      );
    }

    if (widgetType === 'select') {
      const selectOptions = parseSelectOptions(payload);
      const isMulti = payload.multi === true;
      return (
        <div data-part="confirm-widget-body">
          <SelectableList
            items={selectOptions}
            mode={isMulti ? 'multiple' : 'single'}
            searchable={payload.searchable !== false}
            selectedIds={selectedListIds}
            onSelectionChange={setSelectedListIds}
          />
          <RequestActionBar
            key={actionBarKey}
            primaryLabel="Submit"
            primaryDisabled={selectedListIds.length === 0}
            commentEnabled
            onPrimary={(comment) => {
              if (mode === 'script') {
                emitSubmit(mode, {
                  ...(isMulti
                    ? { selectedMulti: { values: selectedListIds } }
                    : { selectedSingle: selectedListIds[0] ?? '' }),
                  ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
                });
                return;
              }

              emitSubmit(mode, {
                selectedIds: selectedListIds,
                ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
              });
            }}
          />
        </div>
      );
    }

    if (widgetType === 'form') {
      const schema = asRecord(payload.schema);
      if (Object.keys(schema).length === 0) {
        return renderPlaceholder('Form schema missing');
      }
      return (
        <SchemaFormRenderer
          schema={schema as JsonSchemaNode}
          submitLabel="Submit"
          onSubmit={(value: Record<string, unknown>) => {
            if (mode === 'script') {
              emitSubmit(mode, { data: value });
              return;
            }
            emitSubmit(mode, { value });
          }}
        />
      );
    }

    if (widgetType === 'table') {
      const tableRows = parseTableRows(payload);
      const tableColumns = parseTableColumns(payload, tableRows);
      if (tableColumns.length === 0) {
        return renderPlaceholder('No table columns available');
      }

      const rowKey = typeof payload.rowKey === 'string' ? payload.rowKey : undefined;
      const selectedRows = resolveSelectedTableRows(tableRows, selectedTableRows, rowKey);
      const isMulti = payload.multiSelect === true;

      return (
        <div data-part="confirm-widget-body">
          <SelectableDataTable
            items={tableRows}
            columns={tableColumns}
            rowKey={rowKey}
            selectedRowKeys={selectedTableRows}
            onSelectionChange={setSelectedTableRows}
            mode={isMulti ? 'multiple' : 'single'}
            searchable={payload.searchable !== false}
          />
          <RequestActionBar
            key={actionBarKey}
            primaryLabel="Submit"
            primaryDisabled={selectedTableRows.length === 0}
            commentEnabled
            onPrimary={(comment) => {
              if (mode === 'script') {
                emitSubmit(mode, {
                  ...(isMulti
                    ? { selectedMulti: { values: selectedRows } }
                    : { selectedSingle: selectedRows[0] ?? {} }),
                  ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
                });
                return;
              }

              emitSubmit(mode, {
                selectedRowKeys: selectedTableRows,
                selectedRows,
                ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
              });
            }}
          />
        </div>
      );
    }

    if (widgetType === 'image') {
      const imageItems = parseImageItems(payload);
      const imageMode = payload.multi === true ? 'multi' : payload.mode === 'confirm' ? 'confirm' : 'select';
      const isConfirmMode = imageMode === 'confirm';
      const isMulti = imageMode === 'multi';

      return (
        <div data-part="confirm-widget-body">
          <ImageChoiceGrid
            items={imageItems}
            selectedIds={selectedImageIds}
            onSelectionChange={setSelectedImageIds}
            mode={imageMode}
          />
          {isConfirmMode ? (
            <RequestActionBar
              key={actionBarKey}
              primaryLabel={typeof payload.approveText === 'string' ? payload.approveText : 'Approve'}
              secondaryLabel={typeof payload.rejectText === 'string' ? payload.rejectText : 'Reject'}
              commentEnabled
              onPrimary={(comment) =>
                emitSubmit(mode, {
                  selectedBool: true,
                  ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
                })
              }
              onSecondary={(comment) =>
                emitSubmit(mode, {
                  selectedBool: false,
                  ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
                })
              }
            />
          ) : (
            <RequestActionBar
              key={actionBarKey}
              primaryLabel="Submit"
              primaryDisabled={selectedImageIds.length === 0}
              commentEnabled
              onPrimary={(comment) => {
                if (mode === 'script') {
                  emitSubmit(mode, {
                    ...(isMulti
                      ? { selectedStrings: { values: selectedImageIds } }
                      : { selectedString: selectedImageIds[0] ?? '' }),
                    ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
                  });
                  return;
                }

                emitSubmit(mode, {
                  selectedImageIds,
                  ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
                });
              }}
            />
          )}
        </div>
      );
    }

    if (widgetType === 'rating') {
      const scale = typeof payload.scale === 'number' ? payload.scale : 5;
      const styleRaw = normalizeWidgetType(payload.style);
      const style = styleRaw === 'stars' || styleRaw === 'emoji' || styleRaw === 'slider' ? styleRaw : 'numbers';
      const defaults = asRecord(payload.defaults);
      const fallbackValue =
        typeof defaults.value === 'number'
          ? defaults.value
          : typeof payload.defaultValue === 'number'
            ? payload.defaultValue
            : Math.max(1, Math.ceil(scale / 2));
      const resolvedValue = selectedRating ?? fallbackValue;

      return (
        <div data-part="confirm-widget-body">
          <RatingPicker
            scale={scale}
            style={style}
            value={resolvedValue}
            lowLabel={asString(asRecord(payload.labels).low)}
            highLabel={asString(asRecord(payload.labels).high)}
            onChange={setSelectedRating}
          />
          <RequestActionBar
            key={actionBarKey}
            primaryLabel="Submit"
            commentEnabled
            onPrimary={(comment) =>
              emitSubmit(mode, {
                value: resolvedValue,
                ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
              })
            }
          />
        </div>
      );
    }

    if (widgetType === 'grid') {
      const rows = typeof payload.rows === 'number' ? payload.rows : 1;
      const cols = typeof payload.cols === 'number' ? payload.cols : 1;
      const cellSizeRaw = normalizeWidgetType(payload.cellSize);
      const cellSize = cellSizeRaw === 'small' || cellSizeRaw === 'large' ? cellSizeRaw : 'medium';
      const cells = Array.isArray(payload.cells)
        ? payload.cells
            .filter((entry) => typeof entry === 'object' && entry !== null)
            .map((entry) => {
              const cell = entry as Record<string, unknown>;
              return {
                value: asString(cell.value),
                label: asString(cell.label),
                color: asString(cell.color),
                disabled: cell.disabled === true,
                style: asString(cell.style),
              };
            })
        : [];

      return (
        <div data-part="confirm-widget-body">
          <GridBoard
            rows={rows}
            cols={cols}
            cells={cells}
            cellSize={cellSize}
            selectedIndex={selectedGridCell?.cellIndex ?? null}
            onSelect={setSelectedGridCell}
          />
          <RequestActionBar
            key={actionBarKey}
            primaryLabel="Submit"
            primaryDisabled={selectedGridCell === null}
            commentEnabled
            onPrimary={(comment) =>
              emitSubmit(mode, {
                ...(selectedGridCell ?? {}),
                ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
              })
            }
          />
        </div>
      );
    }

    if (widgetType === 'upload') {
      const accept = toStringArray(payload.accept);
      const multiple = payload.multiple === true;
      const maxSize = typeof payload.maxSize === 'number' ? payload.maxSize : undefined;

      return (
        <div data-part="confirm-widget-body">
          <FilePickerDropzone
            accept={accept}
            multiple={multiple}
            maxSizeBytes={maxSize}
            onFilesChange={(accepted) => {
              setSelectedUploadFiles(
                accepted.map((file) => ({
                  name: file.name,
                  size: file.size,
                  path: '',
                  mimeType: file.type,
                })),
              );
            }}
          />
          <RequestActionBar
            key={actionBarKey}
            primaryLabel="Submit"
            primaryDisabled={selectedUploadFiles.length === 0}
            commentEnabled
            onPrimary={(comment) =>
              emitSubmit(mode, {
                files: selectedUploadFiles,
                ...(normalizeComment(comment) ? { comment: normalizeComment(comment) } : {}),
              })
            }
          />
        </div>
      );
    }

    return renderPlaceholder(`Unsupported widget type: ${widgetType || 'undefined'}`);
  };

  if (request.widgetType === 'script') {
    const scriptView = request.scriptView;
    if (!scriptView) {
      return renderPlaceholder('Script view unavailable');
    }

    const sections = Array.isArray(scriptView.sections) ? scriptView.sections : [];
    const hasSections = sections.length > 0;
    const interactiveSections = hasSections ? sections.filter((section) => isInteractiveScriptSection(section)) : [];

    const scriptProgress = scriptView.progress;
    const showProgress =
      typeof scriptProgress?.current === 'number' && typeof scriptProgress?.total === 'number' && scriptProgress.total > 0;

    if (hasSections && interactiveSections.length !== 1) {
      return renderPlaceholder('Invalid script sections: exactly one interactive section is required');
    }

    const scriptContent = hasSections
      ? sections.map((section, index) => {
          const sectionType = resolveScriptSectionType(section);
          if (sectionType === 'display') {
            return <ScriptDisplaySection key={`${section.id}-${index}`} payload={asRecord(section.input)} />;
          }
          return <div key={`${section.id}-${index}`}>{renderWidget(sectionType, asRecord(section.input), 'script')}</div>;
        })
      : [
          <div key={scriptView.stepId ?? scriptView.widgetType}>
            {renderWidget(normalizeWidgetType(scriptView.widgetType), asRecord(scriptView.input), 'script')}
          </div>,
        ];

    return (
      <div data-part="confirm-section">
        {scriptView.title && <div data-part="confirm-heading">{scriptView.title}</div>}
        {scriptView.description && <div data-part="confirm-description">{scriptView.description}</div>}
        {showProgress && (
          <div data-part="confirm-progress">
            {scriptProgress?.label ?? `Step ${scriptProgress?.current} of ${scriptProgress?.total}`}
          </div>
        )}
        {scriptView.allowBack && (
          <div>
            <button type="button" data-part="btn" onClick={submitBack}>
              {scriptView.backLabel ?? 'Back'}
            </button>
          </div>
        )}
        {scriptContent}
      </div>
    );
  }

  return renderWidget(request.widgetType, asRecord(request.input?.payload), 'response') ?? (
    <DataTable
      items={[{ detail: `Unsupported widget type: ${request.widgetType}` }]}
      columns={[{ key: 'detail', label: 'Detail' }]}
    />
  );
}
