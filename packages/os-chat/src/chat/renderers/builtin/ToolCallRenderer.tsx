import type { RenderEntity } from '../types';

export function ToolCallRenderer({ e }: { e: RenderEntity }) {
  const name = String(e.props.name ?? 'tool');
  const input = e.props.input ?? {};
  const done = e.props.done === true;

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Tool:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{name}</strong> {done ? '(done)' : '(running)'}
      </div>
      <pre
        style={{
          margin: '4px 0 0',
          fontSize: 10,
          whiteSpace: 'pre-wrap',
          opacity: 0.9,
        }}
      >
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}
