import { useDispatch } from 'react-redux';
import type { RenderContext, RenderEntity } from '@hypercard/chat-runtime';
import { SyntaxHighlight, recordField, stringField } from '@hypercard/chat-runtime';
import { openWindow } from '@hypercard/engine/desktop-core';
import { buildArtifactOpenWindowPayload, normalizeArtifactId } from '../artifacts/artifactRuntime';
import { openCodeEditor } from '../editor/editorLaunch';

function cardPayload(props: Record<string, unknown>): Record<string, unknown> | undefined {
  return recordField(props, 'result') ?? props;
}

function cardData(props: Record<string, unknown>): Record<string, unknown> | undefined {
  return recordField(cardPayload(props) ?? {}, 'data');
}

function cardArtifactId(props: Record<string, unknown>): string {
  const payload = cardPayload(props);
  const payloadData = cardData(props);
  const artifact =
    recordField(payload ?? {}, 'artifact') ??
    recordField(payloadData ?? {}, 'artifact');
  return stringField(props, 'artifactId') ?? stringField(artifact ?? {}, 'id') ?? '';
}

function runtimeCardId(props: Record<string, unknown>): string {
  const payload = cardPayload(props);
  const payloadData = cardData(props);
  const card =
    recordField(payload ?? {}, 'card') ??
    recordField(payloadData ?? {}, 'card');
  return stringField(props, 'runtimeCardId') ?? stringField(card ?? {}, 'id') ?? '';
}

function runtimeCardCode(props: Record<string, unknown>): string {
  const payload = cardPayload(props);
  const payloadData = cardData(props);
  const card =
    recordField(payload ?? {}, 'card') ??
    recordField(payloadData ?? {}, 'card');
  return stringField(props, 'runtimeCardCode') ?? stringField(card ?? {}, 'code') ?? '';
}

function titleFromCard(props: Record<string, unknown>): string {
  const payload = cardPayload(props);
  return (
    stringField(props, 'title') ??
    stringField(props, 'name') ??
    stringField(payload ?? {}, 'title') ??
    stringField(payload ?? {}, 'name') ??
    'Card'
  );
}

function detailFromCard(props: Record<string, unknown>): { status: string; detail: string } {
  const payload = cardPayload(props);
  const error = stringField(props, 'error') ?? stringField(payload ?? {}, 'error') ?? '';
  if (error) {
    return { status: 'error', detail: error };
  }
  return {
    status: stringField(props, 'status') ?? 'success',
    detail: stringField(props, 'detail') ?? 'ready',
  };
}

export function HypercardCardRenderer({ e, ctx }: { e: RenderEntity; ctx?: RenderContext }) {
  const dispatch = useDispatch();
  const props = e.props;
  const title = titleFromCard(props);
  const { status, detail } = detailFromCard(props);
  const artifactId = cardArtifactId(props);
  const cardId = runtimeCardId(props);
  const cardCode = runtimeCardCode(props);
  const stackId = props.stackId ? String(props.stackId) : undefined;
  const hasRuntimeCard = cardId.trim().length > 0;
  const hasCardCode = cardCode.trim().length > 0;
  const canOpenArtifact = Boolean(normalizeArtifactId(artifactId) && hasRuntimeCard && status !== 'streaming' && status !== 'pending');
  const canEditCode = hasRuntimeCard && hasCardCode && status !== 'streaming' && status !== 'pending';

  const openArtifact = () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId,
      title,
      runtimeCardId: cardId,
      stackId,
    });
    if (!payload) {
      return;
    }
    dispatch(openWindow(payload));
  };

  const editArtifact = () => {
    if (!hasRuntimeCard || !hasCardCode) {
      return;
    }
    openCodeEditor(dispatch, { ownerAppId: 'inventory', cardId }, cardCode);
  };

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Card:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{title}</strong>{cardId ? ` · runtime=${cardId}` : ''}
        {detail ? ` — ${detail}` : ''}
      </div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap', opacity: 0.8 }}>
        status: {status}
      </div>
      {hasCardCode && (
        <SyntaxHighlight
          code={cardCode}
          language="javascript"
          maxLines={18}
          style={{ marginTop: 6 }}
        />
      )}
      {ctx?.mode === 'debug' && (
        <pre
          style={{
            margin: '6px 0 0',
            fontSize: 10,
            whiteSpace: 'pre-wrap',
            opacity: 0.9,
          }}
        >
          {JSON.stringify(e.props, null, 2)}
        </pre>
      )}
      {(canOpenArtifact || canEditCode) && (
        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
          {canOpenArtifact && (
            <button type="button" data-part="btn" onClick={openArtifact}>
              Open
            </button>
          )}
          {canEditCode && (
            <button type="button" data-part="btn" onClick={editArtifact}>
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
