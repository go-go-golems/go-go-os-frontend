import { useContext, useEffect, useMemo, useReducer } from 'react';
import { Btn, Checkbox } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import type { Conversation, SearchParams } from './types';
import { CONVERSATIONS, getAllTags, getAllModels } from './sampleData';
import {
  CHAT_BROWSER_STATE_KEY,
  chatBrowserActions,
  chatBrowserReducer,
  createChatBrowserStateSeed,
  selectChatBrowserState,
  type ChatBrowserAction,
  type ChatBrowserState,
} from './chatBrowserState';

export interface ChatBrowserProps {
  conversations?: Conversation[];
}

function createInitialSeed(props: ChatBrowserProps): ChatBrowserState {
  return createChatBrowserStateSeed({
    conversations: props.conversations ?? CONVERSATIONS,
  });
}

function ConvoRow({
  convo,
  selected,
  even,
  onSelect,
}: {
  convo: Conversation;
  selected: boolean;
  even: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      data-part={P.cbConvoRow}
      data-selected={selected || undefined}
      data-even={even || undefined}
      onClick={onSelect}
    >
      <div data-part={P.cbConvoRowTop}>
        <span data-part={P.cbConvoTitle}>
          {'\uD83D\uDCAC'} {convo.title}
        </span>
        <span data-part={P.cbConvoMsgCount}>{convo.messages.length} msgs</span>
      </div>
      <div data-part={P.cbConvoRowMeta}>
        <span>{'\uD83E\uDD16'} {convo.model}</span>
        <span>{'\uD83D\uDCC5'} {convo.date}</span>
      </div>
      <div data-part={P.cbConvoTags}>
        {convo.tags.map((tag) => (
          <span key={tag} data-part={P.cbTag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  model,
}: {
  message: { role: 'user' | 'assistant'; text: string };
  model: string;
}) {
  return (
    <div data-part={P.cbMessage} data-role={message.role}>
      <div data-part={P.cbMessageHeader}>
        <span data-part={P.cbMessageIcon}>
          {message.role === 'user' ? '\uD83D\uDC64' : '\uD83E\uDD16'}
        </span>
        {message.role === 'user' ? 'You' : model}
      </div>
      <div data-part={P.cbMessageText}>{message.text}</div>
    </div>
  );
}

function SearchPanel({
  params,
  allTags,
  allModels,
  onChange,
  onSearch,
  onClear,
  onClose,
}: {
  params: SearchParams;
  allTags: string[];
  allModels: string[];
  onChange: (params: SearchParams) => void;
  onSearch: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const toggleTag = (tag: string) => {
    onChange({
      ...params,
      tags: params.tags.includes(tag)
        ? params.tags.filter((value) => value !== tag)
        : [...params.tags, tag],
    });
  };

  return (
    <div data-part={P.cbSearchPanel}>
      <div data-part={P.cbSearchSection}>
        <div data-part={P.cbSearchLabel}>Search Text:</div>
        <input
          data-part="field-input"
          value={params.text}
          onChange={(event) => onChange({ ...params, text: event.target.value })}
          placeholder="Enter search terms..."
          onKeyDown={(event) => event.key === 'Enter' && onSearch()}
        />
      </div>

      <div data-part={P.cbSearchScope}>
        <Checkbox
          label="In titles"
          checked={params.inTitles}
          onChange={() => onChange({ ...params, inTitles: !params.inTitles })}
        />
        <Checkbox
          label="In messages"
          checked={params.inMessages}
          onChange={() => onChange({ ...params, inMessages: !params.inMessages })}
        />
      </div>

      <div data-part={P.cbSearchSection}>
        <div data-part={P.cbSearchLabel}>Model:</div>
        <div data-part={P.cbModelFilter}>
          <Btn active={!params.model} onClick={() => onChange({ ...params, model: '' })}>
            All
          </Btn>
          {allModels.map((model) => (
            <Btn
              key={model}
              active={params.model === model}
              onClick={() => onChange({ ...params, model })}
            >
              {model}
            </Btn>
          ))}
        </div>
      </div>

      <div data-part={P.cbSearchSection}>
        <div data-part={P.cbSearchLabel}>Tags:</div>
        <div data-part={P.cbTagFilter}>
          {allTags.map((tag) => (
            <span
              key={tag}
              data-part={P.cbFilterTag}
              data-active={params.tags.includes(tag) || undefined}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div data-part={P.cbSearchSection}>
        <div data-part={P.cbSearchLabel}>Date Range:</div>
        <div data-part={P.cbDateRange}>
          <input
            data-part="field-input"
            type="date"
            value={params.dateFrom}
            onChange={(event) => onChange({ ...params, dateFrom: event.target.value })}
          />
          <span>to</span>
          <input
            data-part="field-input"
            type="date"
            value={params.dateTo}
            onChange={(event) => onChange({ ...params, dateTo: event.target.value })}
          />
        </div>
      </div>

      <div data-part={P.cbSearchActions}>
        <Btn onClick={() => { onClear(); onClose(); }}>Clear</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn onClick={onSearch}>{'\uD83D\uDD0D'} Search</Btn>
      </div>
    </div>
  );
}

function ChatBrowserFrame({
  state,
  dispatch,
}: {
  state: ChatBrowserState;
  dispatch: (action: ChatBrowserAction) => void;
}) {
  const { conversations, selectedConversationId, quickFilter, searchParams, searchResultIds, showSearch } = state;
  const selectedConvo = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;

  const allTags = useMemo(() => getAllTags(conversations), [conversations]);
  const allModels = useMemo(() => getAllModels(conversations), [conversations]);

  const displayedConvos = useMemo(() => {
    let list = searchResultIds
      ? conversations.filter((conversation) => searchResultIds.includes(conversation.id))
      : conversations;

    if (quickFilter) {
      const query = quickFilter.toLowerCase();
      list = list.filter(
        (conversation) =>
          conversation.title.toLowerCase().includes(query) ||
          conversation.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          conversation.model.toLowerCase().includes(query),
      );
    }

    return list;
  }, [conversations, quickFilter, searchResultIds]);

  const runSearch = () => {
    const { text, model, tags, dateFrom, dateTo, inMessages, inTitles } = searchParams;
    let results = [...conversations];

    if (text) {
      const query = text.toLowerCase();
      results = results.filter((conversation) => {
        const titleMatch = inTitles && conversation.title.toLowerCase().includes(query);
        const msgMatch =
          inMessages &&
          conversation.messages.some((message) => message.text.toLowerCase().includes(query));
        return titleMatch || msgMatch;
      });
    }

    if (model) results = results.filter((conversation) => conversation.model === model);
    if (tags.length) results = results.filter((conversation) => tags.some((tag) => conversation.tags.includes(tag)));
    if (dateFrom) results = results.filter((conversation) => conversation.date >= dateFrom);
    if (dateTo) results = results.filter((conversation) => conversation.date <= dateTo);

    dispatch(chatBrowserActions.setSearchResultIds(results.map((conversation) => conversation.id)));
    dispatch(chatBrowserActions.setShowSearch(false));
  };

  const clearSearch = () => {
    dispatch(chatBrowserActions.clearSearch());
  };

  return (
    <div data-part={P.chatBrowser}>
      <div data-part={P.cbSidebar}>
        <WidgetToolbar>
          <input
            data-part="field-input"
            placeholder="Quick filter..."
            value={quickFilter}
            onChange={(event) => dispatch(chatBrowserActions.setQuickFilter(event.target.value))}
            style={{ flex: 1 }}
          />
          <Btn onClick={() => dispatch(chatBrowserActions.setShowSearch(!showSearch))}>
            {'\uD83D\uDD0D'}
          </Btn>
          {searchResultIds && <Btn onClick={clearSearch}>{'\u2715'}</Btn>}
        </WidgetToolbar>

        <div data-part={P.cbConvoList}>
          {displayedConvos.length === 0 && <EmptyState message="No conversations found." />}
          {displayedConvos.map((conversation, index) => (
            <ConvoRow
              key={conversation.id}
              convo={conversation}
              selected={selectedConvo?.id === conversation.id}
              even={index % 2 === 0}
              onSelect={() => dispatch(chatBrowserActions.setSelectedConversationId(conversation.id))}
            />
          ))}
        </div>

        <WidgetStatusBar>
          <span>{displayedConvos.length} conversations</span>
          <span>{searchResultIds ? '\uD83D\uDD0D Filtered' : '\uD83D\uDCC2 All'}</span>
        </WidgetStatusBar>
      </div>

      <div data-part={P.cbMain}>
        {showSearch ? (
          <SearchPanel
            params={searchParams}
            allTags={allTags}
            allModels={allModels}
            onChange={(params) => dispatch(chatBrowserActions.setSearchParams(params))}
            onSearch={runSearch}
            onClear={clearSearch}
            onClose={() => dispatch(chatBrowserActions.setShowSearch(false))}
          />
        ) : !selectedConvo ? (
          <EmptyState
            icon={'\uD83D\uDDC4\uFE0F'}
            message={
              <>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>No Conversation Selected</div>
                <div>Select a conversation from the list to view it here.</div>
              </>
            }
          />
        ) : (
          <>
            <div data-part={P.cbViewerHeader}>
              <div data-part={P.cbViewerTitle}>{selectedConvo.title}</div>
              <div data-part={P.cbViewerMeta}>
                <span>{'\uD83E\uDD16'} Model: {selectedConvo.model}</span>
                <span>{'\uD83D\uDCC5'} {selectedConvo.date}</span>
                <span>{'\uD83D\uDCAC'} {selectedConvo.messages.length} messages</span>
              </div>
              <div data-part={P.cbViewerTags}>
                {selectedConvo.tags.map((tag) => (
                  <span key={tag} data-part={P.cbTag}>{tag}</span>
                ))}
              </div>
            </div>

            <div data-part={P.cbMessages}>
              {selectedConvo.messages.map((message, index) => (
                <MessageBubble key={index} message={message} model={selectedConvo.model} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StandaloneChatBrowser(props: ChatBrowserProps) {
  const [state, dispatch] = useReducer(chatBrowserReducer, createInitialSeed(props));

  return <ChatBrowserFrame state={state} dispatch={dispatch} />;
}

function ConnectedChatBrowser(props: ChatBrowserProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectChatBrowserState);

  useEffect(() => {
    reduxDispatch(chatBrowserActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.conversations, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  return <ChatBrowserFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function ChatBrowser(props: ChatBrowserProps = {}) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    CHAT_BROWSER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedChatBrowser {...props} />;
  }

  return <StandaloneChatBrowser {...props} />;
}
