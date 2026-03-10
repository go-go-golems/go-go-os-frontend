import { createListenerMiddleware, type PayloadAction } from '@reduxjs/toolkit';
import { timelineSlice, type TimelineEntity } from '@hypercard/chat-runtime';
import { registerRuntimeCard } from '../../plugin-runtime';
import { extractArtifactUpsertFromTimelineEntity } from './artifactRuntime';
import { upsertArtifact } from './artifactsSlice';

function projectArtifactFromEntity(dispatch: (action: unknown) => unknown, entity: TimelineEntity | undefined) {
  if (!entity) {
    return;
  }

  const upsert = extractArtifactUpsertFromTimelineEntity(entity.kind, entity.props);
  if (!upsert) {
    return;
  }

  dispatch(
    upsertArtifact({
      ...upsert,
      updatedAt: Date.now(),
    }),
  );

  if (upsert.runtimeCardId && upsert.runtimeCardCode) {
    registerRuntimeCard(upsert.runtimeCardId, upsert.runtimeCardCode, upsert.packId);
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
