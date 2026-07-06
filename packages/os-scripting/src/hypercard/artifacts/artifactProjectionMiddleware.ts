import { createListenerMiddleware, type PayloadAction, type UnknownAction } from '@reduxjs/toolkit';
import { registerRuntimeSurface } from '../../plugin-runtime';
import { extractArtifactUpsertFromTimelineEntity } from './artifactRuntime';
import { upsertArtifact } from './artifactsSlice';

export interface TimelineEntityLike {
  id: string;
  kind: string;
  createdAt?: number;
  updatedAt?: number;
  version?: number;
  props: Record<string, unknown>;
}

function runtimeSurfaceEntityIsFinal(entity: TimelineEntityLike): boolean {
  const rawStatus = entity.props.status;
  if (typeof rawStatus !== 'string') {
    return true;
  }
  const status = rawStatus.trim().toLowerCase();
  return status !== 'streaming' && status !== 'pending';
}

function projectArtifactFromEntity(dispatch: (action: unknown) => unknown, entity: TimelineEntityLike | undefined) {
  if (!entity) {
    return;
  }

  const upsert = extractArtifactUpsertFromTimelineEntity(entity.kind, entity.props);
  if (!upsert) {
    return;
  }

  const queueForInjection =
    runtimeSurfaceEntityIsFinal(entity) &&
    Boolean(upsert.runtimeSurfaceId && upsert.runtimeSurfaceCode && upsert.packId);

  dispatch(
    upsertArtifact({
      ...upsert,
      updatedAt: Date.now(),
      queueForInjection,
    }),
  );

  if (queueForInjection && upsert.runtimeSurfaceId && upsert.runtimeSurfaceCode && upsert.packId) {
    registerRuntimeSurface(upsert.runtimeSurfaceId, upsert.runtimeSurfaceCode, upsert.packId);
  }
}

type ConversationEntityPayload = { convId: string; entity: TimelineEntityLike };
type SnapshotPayload = { convId: string; entities: TimelineEntityLike[] };

type ConversationEntityAction = PayloadAction<ConversationEntityPayload>;
type SnapshotAction = PayloadAction<SnapshotPayload>;

const ENTITY_ACTION_TYPES = new Set(['timeline/addEntity', 'timeline/upsertEntity']);
const SNAPSHOT_ACTION_TYPES = new Set(['timeline/applySnapshot', 'timeline/mergeSnapshot']);

function hasRecordPayload(action: UnknownAction): action is UnknownAction & { payload: Record<string, unknown> } {
  return Boolean(action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload));
}

function isTimelineEntityAction(action: UnknownAction): action is ConversationEntityAction {
  return ENTITY_ACTION_TYPES.has(action.type) && hasRecordPayload(action) && 'entity' in action.payload;
}

function isTimelineSnapshotAction(action: UnknownAction): action is SnapshotAction {
  return SNAPSHOT_ACTION_TYPES.has(action.type) && hasRecordPayload(action) && Array.isArray(action.payload.entities);
}

export function createArtifactProjectionMiddleware() {
  const listener = createListenerMiddleware();

  listener.startListening({
    predicate: isTimelineEntityAction,
    effect: (action, api) => {
      projectArtifactFromEntity(api.dispatch, action.payload.entity);
    },
  });

  listener.startListening({
    predicate: isTimelineSnapshotAction,
    effect: (action, api) => {
      for (const entity of action.payload.entities) {
        projectArtifactFromEntity(api.dispatch, entity);
      }
    },
  });

  return listener;
}
