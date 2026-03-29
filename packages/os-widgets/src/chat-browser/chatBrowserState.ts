import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { CONVERSATIONS } from './sampleData';
import { EMPTY_SEARCH, type Conversation, type SearchParams } from './types';

export const CHAT_BROWSER_STATE_KEY = 'app_rw_chat_browser' as const;

export interface ChatBrowserStateSeed {
  conversations?: readonly Conversation[];
  selectedConversationId?: number | null;
  quickFilter?: string;
  searchParams?: Partial<SearchParams>;
  searchResultIds?: number[] | null;
  showSearch?: boolean;
}

export interface ChatBrowserState {
  initialized: boolean;
  conversations: Conversation[];
  selectedConversationId: number | null;
  quickFilter: string;
  searchParams: SearchParams;
  searchResultIds: number[] | null;
  showSearch: boolean;
}

type ChatBrowserModuleState = ChatBrowserState | undefined;
type ChatBrowserStateInput = ChatBrowserStateSeed | ChatBrowserState | undefined;

function cloneConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    tags: [...conversation.tags],
    messages: conversation.messages.map((message) => ({ ...message })),
  };
}

function normalizeSearchParams(searchParams?: Partial<SearchParams>): SearchParams {
  return {
    ...EMPTY_SEARCH,
    ...(searchParams ?? {}),
    tags: [...(searchParams?.tags ?? EMPTY_SEARCH.tags)],
  };
}

export function createChatBrowserStateSeed(
  seed: ChatBrowserStateSeed = {},
): ChatBrowserState {
  return {
    initialized: true,
    conversations: (seed.conversations ?? CONVERSATIONS).map(cloneConversation),
    selectedConversationId: seed.selectedConversationId ?? null,
    quickFilter: seed.quickFilter ?? '',
    searchParams: normalizeSearchParams(seed.searchParams),
    searchResultIds: seed.searchResultIds ? [...seed.searchResultIds] : null,
    showSearch: seed.showSearch ?? false,
  };
}

function materializeChatBrowserState(seed: ChatBrowserStateInput): ChatBrowserState {
  if (seed && typeof seed === 'object' && 'initialized' in seed) {
    return {
      ...seed,
      conversations: seed.conversations.map(cloneConversation),
      searchParams: normalizeSearchParams(seed.searchParams),
      searchResultIds: seed.searchResultIds ? [...seed.searchResultIds] : null,
    };
  }

  return createChatBrowserStateSeed(seed);
}

const initialState: ChatBrowserState = {
  ...createChatBrowserStateSeed(),
  initialized: false,
};

export const chatBrowserSlice = createSlice({
  name: 'chatBrowser',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<ChatBrowserStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeChatBrowserState(action.payload);
    },
    replaceState(_state, action: PayloadAction<ChatBrowserStateInput>) {
      return materializeChatBrowserState(action.payload);
    },
    setSelectedConversationId(state, action: PayloadAction<number | null>) {
      state.selectedConversationId = action.payload;
    },
    setQuickFilter(state, action: PayloadAction<string>) {
      state.quickFilter = action.payload;
    },
    setSearchParams(state, action: PayloadAction<SearchParams>) {
      state.searchParams = normalizeSearchParams(action.payload);
    },
    setSearchResultIds(state, action: PayloadAction<number[] | null>) {
      state.searchResultIds = action.payload ? [...action.payload] : null;
    },
    setShowSearch(state, action: PayloadAction<boolean>) {
      state.showSearch = action.payload;
    },
    clearSearch(state) {
      state.searchResultIds = null;
      state.searchParams = normalizeSearchParams();
    },
  },
});

export const chatBrowserReducer = chatBrowserSlice.reducer;
export const chatBrowserActions = chatBrowserSlice.actions;
export type ChatBrowserAction = ReturnType<
  (typeof chatBrowserActions)[keyof typeof chatBrowserActions]
>;

const selectRawChatBrowserState = (rootState: unknown): ChatBrowserState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, ChatBrowserModuleState>)[CHAT_BROWSER_STATE_KEY]
    : undefined;

export const selectChatBrowserState = (rootState: unknown): ChatBrowserState =>
  selectRawChatBrowserState(rootState) ?? initialState;
