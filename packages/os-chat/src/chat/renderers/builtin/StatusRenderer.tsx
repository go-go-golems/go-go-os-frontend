import type { RenderEntity } from '../types';

export function StatusRenderer({ e }: { e: RenderEntity }) {
  const tone = String(e.props.tone ?? e.props.level ?? 'info');
  const title = String(e.props.title ?? e.props.status ?? 'status');
  const detail = String(e.props.detail ?? '');

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Status:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{title}</strong> ({tone})
        {detail ? ` — ${detail}` : ''}
      </div>
    </div>
  );
}
