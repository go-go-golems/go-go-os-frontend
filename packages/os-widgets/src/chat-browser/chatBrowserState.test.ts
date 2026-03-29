import { describe, expect, it } from 'vitest';
import {
  chatBrowserActions,
  chatBrowserReducer,
  createChatBrowserStateSeed,
} from './chatBrowserState';

describe('chatBrowserState', () => {
  it('creates a normalized seed', () => {
    const state = createChatBrowserStateSeed({
      selectedConversationId: 2,
      quickFilter: 'claude',
      searchParams: { text: 'sql', tags: ['coding'] },
      searchResultIds: [2, 10],
      showSearch: true,
    });

    expect(state).toMatchObject({
      initialized: true,
      selectedConversationId: 2,
      quickFilter: 'claude',
      showSearch: true,
      searchResultIds: [2, 10],
    });
    expect(state.searchParams).toMatchObject({
      text: 'sql',
      tags: ['coding'],
      inMessages: true,
      inTitles: true,
    });
  });

  it('clears search state while preserving selected conversation', () => {
    const seeded = createChatBrowserStateSeed({
      selectedConversationId: 4,
      searchParams: { text: 'async', tags: ['coding'] },
      searchResultIds: [4],
      showSearch: true,
    });

    const cleared = chatBrowserReducer(
      chatBrowserReducer(seeded, chatBrowserActions.setShowSearch(false)),
      chatBrowserActions.clearSearch(),
    );

    expect(cleared).toMatchObject({
      selectedConversationId: 4,
      searchResultIds: null,
      showSearch: false,
    });
    expect(cleared.searchParams).toMatchObject({
      text: '',
      tags: [],
      inMessages: true,
      inTitles: true,
    });
  });
});
