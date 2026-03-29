import { Btn } from '@go-go-golems/os-core';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import type { FormatAction, ViewMode } from './types';

export function MacWriteToolbar({
  formatActions,
  viewMode,
  onExecAction,
  onToggleFind,
  onCycleViewMode,
}: {
  formatActions: FormatAction[];
  viewMode: ViewMode;
  onExecAction: (id: string) => void;
  onToggleFind: () => void;
  onCycleViewMode: () => void;
}) {
  return (
    <WidgetToolbar>
      {formatActions.slice(0, 4).map((action) => (
        <Btn
          key={action.id}
          onClick={() => onExecAction(action.id)}
          title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
          style={{ fontSize: 11, padding: '2px 6px' }}
        >
          {action.icon}
        </Btn>
      ))}

      <Separator />

      {formatActions.filter((action) => action.category === 'heading').map((action) => (
        <Btn
          key={action.id}
          onClick={() => onExecAction(action.id)}
          title={action.label}
          style={{ fontSize: 11, padding: '2px 6px' }}
        >
          {action.icon}
        </Btn>
      ))}

      <Separator />

      {formatActions.filter((action) => action.category === 'insert').slice(0, 4).map((action) => (
        <Btn
          key={action.id}
          onClick={() => onExecAction(action.id)}
          title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
          style={{ fontSize: 11, padding: '2px 6px' }}
        >
          {action.icon}
        </Btn>
      ))}

      <Separator />

      {formatActions.filter((action) => action.category === 'insert').slice(4).map((action) => (
        <Btn
          key={action.id}
          onClick={() => onExecAction(action.id)}
          title={action.label}
          style={{ fontSize: 11, padding: '2px 6px' }}
        >
          {action.icon}
        </Btn>
      ))}

      <div style={{ flex: 1 }} />

      <Btn
        onClick={onToggleFind}
        title="Find & Replace (Ctrl+F)"
        style={{ fontSize: 11, padding: '2px 6px' }}
      >
        🔍
      </Btn>
      <Btn
        onClick={onCycleViewMode}
        title="Toggle View (Ctrl+P)"
        style={{ fontSize: 11, padding: '2px 6px' }}
      >
        {viewMode === 'edit' ? '👁️' : viewMode === 'split' ? '📝' : '📄'}
      </Btn>
    </WidgetToolbar>
  );
}
