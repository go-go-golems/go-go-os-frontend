import { Btn } from '@go-go-golems/os-core';
import { useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { RICH_PARTS as P } from '../parts';
import { parseBrowserMarkdown } from './markdown';
import { MAC_BROWSER_SAMPLE_PAGES } from './sampleData';
import {
  createMacBrowserStateSeed,
  macBrowserActions,
  macBrowserReducer,
  MAC_BROWSER_STATE_KEY,
  selectMacBrowserState,
  type MacBrowserState,
} from './macBrowserState';

export interface MacBrowserProps {}

function createInitialSeed(): MacBrowserState {
  return createMacBrowserStateSeed();
}

function MacBrowserFrame({
  state,
  dispatch,
}: {
  state: MacBrowserState;
  dispatch: (action: Parameters<typeof macBrowserReducer>[1]) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const allPages = useMemo(
    () => ({ ...MAC_BROWSER_SAMPLE_PAGES, ...state.customPages }),
    [state.customPages],
  );

  useEffect(() => {
    if (state.editing) {
      textareaRef.current?.focus();
    }
  }, [state.editing]);

  const navigate = useCallback(
    (addr: string) => {
      dispatch(macBrowserActions.navigate(addr.trim() || 'mac://welcome'));
    },
    [dispatch],
  );

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a.mac-browser-link');
      if (link) {
        event.preventDefault();
        const href = link.getAttribute('data-href');
        if (href) navigate(href);
      }
    };
    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [navigate]);

  const pageContent = allPages[state.url];
  const renderedHtml = pageContent ? parseBrowserMarkdown(pageContent) : null;

  return (
    <div data-part={P.macBrowser}>
      <WidgetToolbar>
        <Btn onClick={() => dispatch(macBrowserActions.goBack())} disabled={state.histIdx <= 0}>
          ◀
        </Btn>
        <Btn
          onClick={() => dispatch(macBrowserActions.goForward())}
          disabled={state.histIdx >= state.history.length - 1}
        >
          ▶
        </Btn>
        <input
          data-part={P.mbAddressBar}
          value={state.inputUrl}
          onChange={(event) => dispatch(macBrowserActions.setInputUrl(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') navigate(state.inputUrl);
          }}
          placeholder="mac://welcome"
        />
        <Btn onClick={() => navigate(state.inputUrl)}>Go</Btn>
        <Btn
          onClick={() => {
            dispatch(macBrowserActions.setEditing(true));
            dispatch(
              macBrowserActions.setEditContent(
                allPages[state.url] ?? '# New Document\n\nStart writing here...',
              ),
            );
          }}
        >
          Edit
        </Btn>
        {state.editing && (
          <Btn
            onClick={() => {
              const address = state.url.startsWith('mac://custom')
                ? state.url
                : `mac://custom-${Date.now()}`;
              dispatch(
                macBrowserActions.saveCustomPage({
                  url: address,
                  content: state.editContent,
                }),
              );
            }}
          >
            Render
          </Btn>
        )}
      </WidgetToolbar>

      <div data-part={P.mbBody}>
        {state.editing ? (
          <textarea
            ref={textareaRef}
            data-part={P.mbEditor}
            value={state.editContent}
            onChange={(event) => dispatch(macBrowserActions.setEditContent(event.target.value))}
            spellCheck={false}
          />
        ) : renderedHtml ? (
          <div
            ref={contentRef}
            data-part={P.mbContent}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <div data-part={P.mbEmpty}>
            <strong>Page not found</strong>
            <span>{state.url}</span>
          </div>
        )}
      </div>

      <WidgetStatusBar>
        <span>{state.url}</span>
        <span>{state.history.length} pages</span>
        <span>{state.editing ? 'Editing' : 'Browsing'}</span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneMacBrowser() {
  const [state, dispatch] = useReducer(macBrowserReducer, createInitialSeed());
  return <MacBrowserFrame state={state} dispatch={dispatch} />;
}

function ConnectedMacBrowser() {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacBrowserState);

  useEffect(() => {
    reduxDispatch(macBrowserActions.initializeIfNeeded(createInitialSeed()));
  }, [reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed();
  return <MacBrowserFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function MacBrowser(_props: MacBrowserProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_BROWSER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacBrowser />;
  }

  return <StandaloneMacBrowser />;
}
