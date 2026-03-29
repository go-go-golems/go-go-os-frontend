import { useDispatch } from 'react-redux';
import type { RenderContext, RenderEntity } from '@go-go-golems/os-chat';
import { SyntaxHighlight, recordField, stringField } from '@go-go-golems/os-chat';
import { openWindow } from '@go-go-golems/os-core/desktop-core';
import { buildArtifactOpenWindowPayload, normalizeArtifactId } from '../artifacts/artifactRuntime';
import { openCodeEditor } from '../editor/editorLaunch';

function artifactPayload(props: Record<string, unknown>): Record<string, unknown> | undefined {
  return recordField(props, 'result') ?? props;
}

function artifactData(props: Record<string, unknown>): Record<string, unknown> | undefined {
  return recordField(artifactPayload(props) ?? {}, 'data');
}

function artifactIdFromCardArtifact(props: Record<string, unknown>): string {
  const payload = artifactPayload(props);
  const payloadData = artifactData(props);
  const artifact =
    recordField(payload ?? {}, 'artifact') ??
    recordField(payloadData ?? {}, 'artifact');
  return stringField(props, 'artifactId') ?? stringField(artifact ?? {}, 'id') ?? '';
}

function runtimeSurfaceId(props: Record<string, unknown>): string {
  const payload = artifactPayload(props);
  const payloadData = artifactData(props);
  const card =
    recordField(payload ?? {}, 'card') ??
    recordField(payloadData ?? {}, 'card');
  return stringField(props, 'runtimeSurfaceId') ?? stringField(card ?? {}, 'id') ?? '';
}

function runtimeSurfaceCode(props: Record<string, unknown>): string {
  const payload = artifactPayload(props);
  const payloadData = artifactData(props);
  const card =
    recordField(payload ?? {}, 'card') ??
    recordField(payloadData ?? {}, 'card');
  return stringField(props, 'runtimeSurfaceCode') ?? stringField(card ?? {}, 'code') ?? '';
}

function runtimeSurfacePackId(props: Record<string, unknown>): string {
  const payload = artifactPayload(props);
  const payloadData = artifactData(props);
  const runtime =
    recordField(payload ?? {}, 'runtime') ??
    recordField(payloadData ?? {}, 'runtime');
  return stringField(props, 'packId') ?? stringField(runtime ?? {}, 'pack') ?? '';
}

function titleFromArtifactCard(props: Record<string, unknown>): string {
  const payload = artifactPayload(props);
  return (
    stringField(props, 'title') ??
    stringField(props, 'name') ??
    stringField(payload ?? {}, 'title') ??
    stringField(payload ?? {}, 'name') ??
    'Card'
  ) ??
    'Card';
}

function detailFromArtifactCard(props: Record<string, unknown>): { status: string; detail: string } {
  const payload = artifactPayload(props);
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
  const title = titleFromArtifactCard(props);
  const { status, detail } = detailFromArtifactCard(props);
  const artifactId = artifactIdFromCardArtifact(props);
  const surfaceId = runtimeSurfaceId(props);
  const surfaceCode = runtimeSurfaceCode(props);
  const surfacePackId = runtimeSurfacePackId(props);
  const bundleId = props.stackId ? String(props.stackId) : undefined;
  const hasRuntimeSurface = surfaceId.trim().length > 0;
  const hasSurfaceCode = surfaceCode.trim().length > 0;
  const hasSurfacePackId = surfacePackId.trim().length > 0;
  const canOpenArtifact = Boolean(
    normalizeArtifactId(artifactId) &&
    hasRuntimeSurface &&
    hasSurfacePackId &&
    status !== 'streaming' &&
    status !== 'pending'
  );
  const canEditCode = hasRuntimeSurface && hasSurfaceCode && status !== 'streaming' && status !== 'pending';

  const openArtifact = () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId,
      title,
      runtimeSurfaceId: surfaceId,
      bundleId,
    });
    if (!payload) {
      return;
    }
    dispatch(openWindow(payload));
  };

  const editArtifact = () => {
    if (!hasRuntimeSurface || !hasSurfaceCode) {
      return;
    }
    openCodeEditor(dispatch, { ownerAppId: 'inventory', surfaceId }, surfaceCode, surfacePackId);
  };

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Card:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{title}</strong>{surfaceId ? ` · runtime=${surfaceId}` : ''}
        {detail ? ` — ${detail}` : ''}
      </div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap', opacity: 0.8 }}>
        status: {status}
      </div>
      {hasSurfaceCode && (
        <SyntaxHighlight
          code={surfaceCode}
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
