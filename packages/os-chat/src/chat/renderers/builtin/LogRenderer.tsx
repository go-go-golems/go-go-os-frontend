import type { RenderEntity } from '../types';

export function LogRenderer({ e }: { e: RenderEntity }) {
  const level = String(e.props.level ?? 'info');
  const message = String(e.props.message ?? '');
  const fields = e.props.fields ?? {};

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Log:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        [{level}] {message}
      </div>
      <pre
        style={{
          margin: '4px 0 0',
          fontSize: 10,
          whiteSpace: 'pre-wrap',
          opacity: 0.85,
        }}
      >
        {JSON.stringify(fields, null, 2)}
      </pre>
    </div>
  );
}
