import type { ReactNode } from 'react';
import { Btn, DropdownMenu, GridBoard, SelectableDataTable } from '@go-go-golems/os-core';
import type { GridSelection } from '@go-go-golems/os-core';
import type { UIEventRef, UINode } from './uiTypes';

export interface UIRuntimeRendererProps {
  tree: UINode;
  onEvent: (handler: string, args?: unknown) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeArgs(eventArgs: unknown, payload: Record<string, unknown>): unknown {
  if (!isRecord(eventArgs)) {
    return payload;
  }

  return {
    ...eventArgs,
    ...payload,
  };
}

function eventHandler(ref: UIEventRef | undefined, onEvent: UIRuntimeRendererProps['onEvent'], payload?: unknown) {
  if (!ref) {
    return;
  }

  if (payload && isRecord(payload)) {
    onEvent(ref.handler, mergeArgs(ref.args, payload));
    return;
  }

  onEvent(ref.handler, ref.args);
}

export function UIRuntimeRenderer({ tree, onEvent }: UIRuntimeRendererProps) {
  function toSelectableTableRows(node: Extract<UINode, { kind: 'selectableTable' }>) {
    const rowKeyIndex = node.props.rowKeyIndex ?? Number.NaN;
    const keyIndex = Number.isFinite(rowKeyIndex) ? Math.max(0, Math.floor(rowKeyIndex)) : 0;
    return node.props.rows.map((row, rowIndex) => {
      const rowValues = Array.isArray(row) ? row : [];
      const entry: Record<string, unknown> = {
        id: String(rowValues[keyIndex] ?? rowIndex),
        __rowIndex: rowIndex,
        __rowValues: rowValues,
      };
      node.props.headers.forEach((_, index) => {
        entry[`c${index}`] = String(rowValues[index] ?? '');
      });
      return entry;
    });
  }

  function renderNode(node: UINode, keyHint: string): ReactNode {
    if (node.kind === 'panel') {
      return (
        <div key={keyHint} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
          {(node.children ?? []).map((child, index) => renderNode(child, `${keyHint}:panel:${index}`))}
        </div>
      );
    }

    if (node.kind === 'column') {
      return (
        <div key={keyHint} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(node.children ?? []).map((child, index) => renderNode(child, `${keyHint}:column:${index}`))}
        </div>
      );
    }

    if (node.kind === 'row') {
      return (
        <div key={keyHint} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(node.children ?? []).map((child, index) => renderNode(child, `${keyHint}:row:${index}`))}
        </div>
      );
    }

    if (node.kind === 'text') {
      return <span key={keyHint}>{node.text}</span>;
    }

    if (node.kind === 'badge') {
      return (
        <span
          key={keyHint}
          style={{
            display: 'inline-flex',
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--hc-accent, #d0e7ff)',
            fontSize: 12,
          }}
        >
          {node.text}
        </span>
      );
    }

    if (node.kind === 'button') {
      return (
        <Btn key={keyHint} variant={node.props.variant as 'default' | 'primary' | 'danger' | undefined} onClick={() => eventHandler(node.props.onClick, onEvent)}>
          {node.props.label}
        </Btn>
      );
    }

    if (node.kind === 'input') {
      return (
        <input
          key={keyHint}
          value={node.props.value}
          placeholder={node.props.placeholder}
          onChange={(event) =>
            eventHandler(node.props.onChange, onEvent, {
              value: event.target.value,
            })
          }
        />
      );
    }

    if (node.kind === 'table') {
      return (
        <table key={keyHint} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {node.props.headers.map((header: string, index: number) => (
                <th key={`${keyHint}:h:${index}`} style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {node.props.rows.map((row: unknown[], rowIndex: number) => (
              <tr key={`${keyHint}:r:${rowIndex}`}>
                {row.map((value: unknown, colIndex: number) => (
                  <td key={`${keyHint}:r:${rowIndex}:c:${colIndex}`} style={{ padding: '4px 0' }}>
                    {String(value ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (node.kind === 'dropdown') {
      const selected = Number.isFinite(node.props.selected) ? Math.max(0, Math.floor(node.props.selected)) : 0;
      return (
        <DropdownMenu
          key={keyHint}
          options={node.props.options}
          selected={selected}
          onSelect={(index: number) =>
            eventHandler(node.props.onSelect, onEvent, {
              index,
              value: String(node.props.options[index] ?? ''),
            })
          }
          width={node.props.width}
        />
      );
    }

    if (node.kind === 'selectableTable') {
      const items = toSelectableTableRows(node);
      const columns = node.props.headers.map((header, index) => ({
        key: `c${index}`,
        label: header,
      }));

      return (
        <SelectableDataTable
          key={keyHint}
          items={items}
          columns={columns}
          rowKey="id"
          selectedRowKeys={node.props.selectedRowKeys ?? []}
          mode={node.props.mode ?? 'single'}
          searchable={node.props.searchable}
          searchText={node.props.searchText}
          searchPlaceholder={node.props.searchPlaceholder}
          emptyMessage={node.props.emptyMessage}
          onSelectionChange={(selectedRowKeys: string[]) =>
            eventHandler(node.props.onSelectionChange, onEvent, {
              selectedRowKeys,
            })
          }
          onSearchTextChange={
            node.props.onSearchChange
              ? (value: string) =>
                  eventHandler(node.props.onSearchChange, onEvent, {
                    value,
                  })
              : undefined
          }
          onRowClick={(row: Record<string, unknown>) =>
            eventHandler(node.props.onRowClick, onEvent, {
              rowIndex: Number(row.__rowIndex ?? -1),
              rowKey: String(row.id ?? ''),
              rowValues: Array.isArray(row.__rowValues) ? row.__rowValues : [],
            })
          }
        />
      );
    }

    if (node.kind === 'gridBoard') {
      return (
        <GridBoard
          key={keyHint}
          rows={node.props.rows}
          cols={node.props.cols}
          cells={node.props.cells}
          selectedIndex={node.props.selectedIndex}
          cellSize={node.props.cellSize}
          disabled={node.props.disabled}
          onSelect={(selection: GridSelection) => eventHandler(node.props.onSelect, onEvent, selection)}
        />
      );
    }

    return null;
  }

  return <>{renderNode(tree, 'plugin-root')}</>;
}
