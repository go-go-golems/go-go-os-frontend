import { useDispatch } from 'react-redux';
import type { RenderContext, RenderEntity } from '../../chat/renderers/types';
import { stringField } from '../../chat/sem/semHelpers';
import type { SemContext, SemEvent } from '../../chat/sem/semRegistry';
import { registerSem } from '../../chat/sem/semRegistry';
import { type TimelineEntity, timelineSlice } from '../../chat/state/timelineSlice';
import { openWindow } from '../../desktop/core';
import {
  buildArtifactOpenWindowPayload,
  extractArtifactUpsertFromSem,
  normalizeArtifactId,
} from '../artifacts/artifactRuntime';
import { buildCodeEditorWindowPayload } from '../editor/editorLaunch';

function asDataRecord(ev: SemEvent): Record<string, unknown> {
  if (typeof ev.data === 'object' && ev.data !== null && !Array.isArray(ev.data)) {
    return ev.data as Record<string, unknown>;
  }
  return {};
}

function widgetEntityId(data: Record<string, unknown>, fallbackId: string): string {
  const itemId = stringField(data, 'itemId') ?? fallbackId;
  return `widget:${itemId}`;
}

function upsertWidgetEntity(ctx: SemContext, ev: SemEvent, status: 'running' | 'success' | 'error', detail: string) {
  const data = asDataRecord(ev);
  const entityId = widgetEntityId(data, ev.id);
  const title = stringField(data, 'title') ?? 'Widget';
  const template = stringField(data, 'widgetType') ?? stringField(data, 'template');
  const itemId = stringField(data, 'itemId') ?? ev.id;

  const artifactUpdate = extractArtifactUpsertFromSem(ev.type, data);

  const entity: TimelineEntity = {
    id: entityId,
    kind: 'hypercard_widget',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    props: {
      title,
      status,
      detail,
      template,
      itemId,
      artifactId: artifactUpdate?.id,
      runtimeCardId: artifactUpdate?.runtimeCardId,
      rawData: data,
    },
  };

  ctx.dispatch(timelineSlice.actions.upsertEntity({ convId: ctx.convId, entity }));
}

export function registerHypercardWidgetSemHandlers() {
  registerSem('hypercard.widget.start', (ev, ctx) => {
    upsertWidgetEntity(ctx, ev, 'running', 'started');
  });

  registerSem('hypercard.widget.update', (ev, ctx) => {
    upsertWidgetEntity(ctx, ev, 'running', 'updating');
  });

  registerSem('hypercard.widget.v1', (ev, ctx) => {
    upsertWidgetEntity(ctx, ev, 'success', 'ready');
  });

  registerSem('hypercard.widget.error', (ev, ctx) => {
    const data = asDataRecord(ev);
    const errorDetail = stringField(data, 'error') ?? 'unknown error';
    upsertWidgetEntity(ctx, ev, 'error', errorDetail);
  });
}

export function HypercardWidgetRenderer({ e, ctx }: { e: RenderEntity; ctx?: RenderContext }) {
  const dispatch = useDispatch();
  const title = String(e.props.title ?? 'Widget');
  const status = String(e.props.status ?? 'running');
  const detail = String(e.props.detail ?? '');
  const artifactId = e.props.artifactId ? String(e.props.artifactId) : '';
  const template = e.props.template ? String(e.props.template) : '';
  const runtimeCardId = e.props.runtimeCardId ? String(e.props.runtimeCardId) : '';
  const hasArtifact = Boolean(normalizeArtifactId(artifactId));
  const hasRuntimeCard = runtimeCardId.trim().length > 0;

  const openArtifact = () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId,
      title,
      runtimeCardId,
    });
    if (!payload) {
      return;
    }
    dispatch(openWindow(payload));
  };

  const editCard = () => {
    if (!hasRuntimeCard) {
      return;
    }
    dispatch(openWindow(buildCodeEditorWindowPayload({ ownerAppId: 'inventory', cardId: runtimeCardId })));
  };

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Widget:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{title}</strong> ({status}){template ? ` · ${template}` : ''}
        {detail ? ` — ${detail}` : ''}
      </div>
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
      {hasArtifact && hasRuntimeCard && (
        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
          <button type="button" data-part="btn" onClick={openArtifact}>
            Open
          </button>
          <button type="button" data-part="btn" onClick={editCard}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
