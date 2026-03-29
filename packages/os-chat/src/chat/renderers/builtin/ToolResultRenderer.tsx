import type { RenderEntity } from '../types';

export function ToolResultRenderer({ e }: { e: RenderEntity }) {
  const customKind = e.props.customKind ? String(e.props.customKind) : '';
  const result = String(e.props.result ?? '');

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Result:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        {customKind ? `[${customKind}] ` : ''}
        {result || '(empty)'}
      </div>
    </div>
  );
}
