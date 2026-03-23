import { createListenerMiddleware, type PayloadAction } from '@reduxjs/toolkit';
import { timelineSlice, type TimelineEntity } from '@hypercard/chat-runtime';
import { registerRuntimeSurface } from '../../plugin-runtime';
import { extractArtifactUpsertFromTimelineEntity } from './artifactRuntime';
import { upsertArtifact } from './artifactsSlice';

function runtimeSurfaceEntityIsFinal(entity: TimelineEntity): boolean {
  const rawStatus = entity.props?.status;
  if (typeof rawStatus !== 'string') {
    return true;
  }
  const status = rawStatus.trim().toLowerCase();
  return status !== 'streaming' && status !== 'pending';
}

function projectArtifactFromEntity(dispatch: (action: unknown) => unknown, entity: TimelineEntity | undefined) {
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

type ConversationEntityPayload = PayloadAction<{ convId: string; entity: TimelineEntity }>;
type SnapshotPayload = PayloadAction<{ convId: string; entities: TimelineEntity[] }>;

export function createArtifactProjectionMiddleware() {
  const listener = createListenerMiddleware();

  listener.startListening({
    actionCreator: timelineSlice.actions.addEntity,
    effect: (action: ConversationEntityPayload, api) => {
      projectArtifactFromEntity(api.dispatch, action.payload.entity);
    },
  });

  listener.startListening({
    actionCreator: timelineSlice.actions.upsertEntity,
    effect: (action: ConversationEntityPayload, api) => {
      projectArtifactFromEntity(api.dispatch, action.payload.entity);
    },
  });

  listener.startListening({
    actionCreator: timelineSlice.actions.applySnapshot,
    effect: (action: SnapshotPayload, api) => {
      for (const entity of action.payload.entities) {
        projectArtifactFromEntity(api.dispatch, entity);
      }
    },
  });

  listener.startListening({
    actionCreator: timelineSlice.actions.mergeSnapshot,
    effect: (action: SnapshotPayload, api) => {
      for (const entity of action.payload.entities) {
        projectArtifactFromEntity(api.dispatch, entity);
      }
    },
  });

  return listener;
}
