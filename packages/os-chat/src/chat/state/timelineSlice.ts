import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  normalizeSuggestionList,
  readSuggestionsEntityProps,
  SUGGESTIONS_ENTITY_KIND,
  type SuggestionsSource,
} from './suggestions';

export type TimelineEntity = {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  version?: number;
  props: unknown;
};

export type ConversationTimelineState = {
  byId: Record<string, TimelineEntity>;
  order: string[];
};

export type TimelineState = {
  byConvId: Record<string, ConversationTimelineState>;
};

interface ConversationEntityPayload {
  convId: string;
  entity: TimelineEntity;
}

interface RekeyEntityPayload {
  convId: string;
  fromId: string;
  toId: string;
}

interface ApplySnapshotPayload {
  convId: string;
  entities: TimelineEntity[];
}

interface UpsertSuggestionsPayload {
  convId: string;
  entityId: string;
  source: SuggestionsSource;
  suggestions: string[];
  replace?: boolean;
  version?: number;
  updatedAt?: number;
}

interface ConsumeSuggestionsPayload {
  convId: string;
  entityId: string;
  consumedAt?: number;
}

const initialState: TimelineState = {
  byConvId: {},
};

function createConversationTimelineState(): ConversationTimelineState {
  return {
    byId: {},
    order: [],
  };
}

function ensureConversationTimeline(state: TimelineState, convId: string): ConversationTimelineState {
  if (!state.byConvId[convId]) {
    state.byConvId[convId] = createConversationTimelineState();
  }
  return state.byConvId[convId];
}

function upsertConversationEntity(conv: ConversationTimelineState, entity: TimelineEntity) {
  const existing = conv.byId[entity.id];

  if (!existing) {
    conv.byId[entity.id] = entity;
    conv.order.push(entity.id);
    return;
  }

  const incomingVersion =
    typeof entity.version === 'number' && Number.isFinite(entity.version) ? entity.version : 0;
  const existingVersion =
    typeof existing.version === 'number' && Number.isFinite(existing.version) ? existing.version : 0;

  if (incomingVersion > 0) {
    if (incomingVersion < existingVersion) {
      return;
    }

    conv.byId[entity.id] = {
      ...existing,
      ...entity,
      createdAt: entity.createdAt || existing.createdAt,
      kind: entity.kind || existing.kind,
      version: incomingVersion,
      props: { ...(existing.props as Record<string, unknown>), ...(entity.props as Record<string, unknown>) },
    };
    return;
  }

  if (existingVersion > 0) {
    conv.byId[entity.id] = {
      ...existing,
      updatedAt: entity.updatedAt ?? existing.updatedAt,
      props: { ...(existing.props as Record<string, unknown>), ...(entity.props as Record<string, unknown>) },
    };
    return;
  }

  conv.byId[entity.id] = {
    ...existing,
    ...entity,
    createdAt: existing.createdAt,
    kind: entity.kind || existing.kind,
    props: { ...(existing.props as Record<string, unknown>), ...(entity.props as Record<string, unknown>) },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    rekeyEntity(state, action: PayloadAction<RekeyEntityPayload>) {
      const { convId, fromId, toId } = action.payload;
      if (!fromId || !toId || fromId === toId) return;

      const conv = ensureConversationTimeline(state, convId);
      const from = conv.byId[fromId];
      if (!from) return;

      const existing = conv.byId[toId];
      if (existing) {
        conv.byId[toId] = {
          ...from,
          ...existing,
          id: toId,
          createdAt: existing.createdAt || from.createdAt,
          updatedAt: existing.updatedAt ?? from.updatedAt,
          version: existing.version ?? from.version,
          props: { ...(from.props as Record<string, unknown>), ...(existing.props as Record<string, unknown>) },
        };
      } else {
        conv.byId[toId] = { ...from, id: toId };
      }

      delete conv.byId[fromId];

      const fromIndex = conv.order.indexOf(fromId);
      if (fromIndex >= 0) {
        const toIndex = conv.order.indexOf(toId);
        if (toIndex >= 0) {
          conv.order.splice(fromIndex, 1);
        } else {
          conv.order[fromIndex] = toId;
        }
      }
    },

    addEntity(state, action: PayloadAction<ConversationEntityPayload>) {
      const { convId, entity } = action.payload;
      const conv = ensureConversationTimeline(state, convId);
      if (conv.byId[entity.id]) return;

      conv.byId[entity.id] = entity;
      conv.order.push(entity.id);
    },

    upsertEntity(state, action: PayloadAction<ConversationEntityPayload>) {
      const { convId, entity } = action.payload;
      const conv = ensureConversationTimeline(state, convId);
      upsertConversationEntity(conv, entity);
    },

    upsertSuggestions(state, action: PayloadAction<UpsertSuggestionsPayload>) {
      const { convId, entityId, source, replace = false, version, updatedAt } = action.payload;
      const normalized = normalizeSuggestionList(action.payload.suggestions);
      if (normalized.length === 0) return;

      const conv = ensureConversationTimeline(state, convId);
      const existing = conv.byId[entityId];

      const existingVersion =
        typeof existing?.version === 'number' && Number.isFinite(existing.version) ? existing.version : 0;
      const incomingVersion = typeof version === 'number' && Number.isFinite(version) ? version : 0;
      if (incomingVersion > 0 && incomingVersion < existingVersion) {
        return;
      }

      const existingProps = readSuggestionsEntityProps(existing);
      const nextItems = replace
        ? normalized
        : normalizeSuggestionList([...(existingProps?.items ?? []), ...normalized]);
      const nextAt = updatedAt ?? Date.now();
      const { consumedAt: _consumedAt, ...baseProps } = asRecord(existing?.props);

      const entity: TimelineEntity = {
        id: entityId,
        kind: SUGGESTIONS_ENTITY_KIND,
        createdAt: existing?.createdAt ?? nextAt,
        updatedAt: nextAt,
        version: incomingVersion > 0 ? incomingVersion : existing?.version,
        props: {
          ...baseProps,
          source,
          items: nextItems,
        },
      };

      if (!existing) {
        conv.byId[entity.id] = entity;
        conv.order.push(entity.id);
        return;
      }

      conv.byId[entity.id] = entity;
    },

    consumeSuggestions(state, action: PayloadAction<ConsumeSuggestionsPayload>) {
      const { convId, entityId, consumedAt } = action.payload;
      const conv = state.byConvId[convId];
      if (!conv) return;
      const existing = conv.byId[entityId];
      if (!existing || existing.kind !== SUGGESTIONS_ENTITY_KIND) return;

      const at = consumedAt ?? Date.now();
      const existingProps = asRecord(existing.props);
      const prevConsumedAt = existingProps.consumedAt;
      if (typeof prevConsumedAt === 'number' && Number.isFinite(prevConsumedAt)) {
        return;
      }

      conv.byId[entityId] = {
        ...existing,
        updatedAt: at,
        props: {
          ...existingProps,
          consumedAt: at,
        },
      };
    },

    applySnapshot(state, action: PayloadAction<ApplySnapshotPayload>) {
      const { convId, entities } = action.payload;
      const byId: Record<string, TimelineEntity> = {};
      const order: string[] = [];

      for (const entity of entities) {
        if (!entity?.id) continue;
        if (!byId[entity.id]) {
          order.push(entity.id);
        }
        byId[entity.id] = entity;
      }

      state.byConvId[convId] = { byId, order };
    },

    mergeSnapshot(state, action: PayloadAction<ApplySnapshotPayload>) {
      const { convId, entities } = action.payload;
      const conv = ensureConversationTimeline(state, convId);

      for (const entity of entities) {
        if (!entity?.id) continue;
        upsertConversationEntity(conv, entity);
      }
    },

    clearConversation(state, action: PayloadAction<{ convId: string }>) {
      delete state.byConvId[action.payload.convId];
    },
  },
});

export const timelineReducer = timelineSlice.reducer;
