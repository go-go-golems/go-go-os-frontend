import type { RenderEntity } from '../types';

export function GenericRenderer({ e }: { e: RenderEntity }) {
  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Entity:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        {e.kind}
      </div>
      <pre
        style={{
          margin: '4px 0 0',
          fontSize: 10,
          whiteSpace: 'pre-wrap',
          opacity: 0.85,
        }}
      >
        {JSON.stringify(e.props ?? {}, null, 2)}
      </pre>
    </div>
  );
}
