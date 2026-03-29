import { useCallback, useContext, useMemo, useReducer, useRef, useState, useEffect } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { parseMarkdown } from './markdown';
import { SAMPLE_DOCUMENT } from './sampleData';
import { MacWriteFindBar } from './MacWriteFindBar';
import { MacWriteToolbar } from './MacWriteToolbar';
import {
  MAC_WRITE_STATE_KEY,
  createMacWriteStateSeed,
  macWriteActions,
  macWriteReducer,
  selectMacWriteState,
  type MacWriteAction,
  type MacWriteState,
} from './macWriteState';
import type { ViewMode, FormatAction, WordCount } from './types';

const FORMAT_ACTIONS: FormatAction[] = [
  { id: 'bold', label: 'Bold', icon: '𝐁', shortcut: 'Ctrl+B', category: 'format' },
  { id: 'italic', label: 'Italic', icon: '𝐼', shortcut: 'Ctrl+I', category: 'format' },
  { id: 'strikethrough', label: 'Strikethrough', icon: 'S̶', category: 'format' },
  { id: 'code', label: 'Inline Code', icon: '<>', shortcut: 'Ctrl+E', category: 'format' },
  { id: 'codeblock', label: 'Code Block', icon: '```', category: 'insert' },
  { id: 'h1', label: 'Heading 1', icon: 'H1', category: 'heading' },
  { id: 'h2', label: 'Heading 2', icon: 'H2', category: 'heading' },
  { id: 'h3', label: 'Heading 3', icon: 'H3', category: 'heading' },
  { id: 'ul', label: 'Bullet List', icon: '•', category: 'insert' },
  { id: 'ol', label: 'Numbered List', icon: '1.', category: 'insert' },
  { id: 'checkbox', label: 'Checkbox', icon: '☑', category: 'insert' },
  { id: 'quote', label: 'Blockquote', icon: '>', category: 'insert' },
  { id: 'link', label: 'Link', icon: '🔗', shortcut: 'Ctrl+K', category: 'insert' },
  { id: 'hr', label: 'Horizontal Rule', icon: '──', category: 'insert' },
  { id: 'table', label: 'Table', icon: '⊞', category: 'insert' },
];

export interface MacWriteProps {
  initialContent?: string;
  initialViewMode?: ViewMode;
  onChange?: (content: string) => void;
}

function createInitialSeed(props: MacWriteProps): MacWriteState {
  return createMacWriteStateSeed({
    content: props.initialContent,
    viewMode: props.initialViewMode,
  });
}

function MacWriteFrame({
  state,
  dispatch,
  onChange,
}: {
  state: MacWriteState;
  dispatch: (action: MacWriteAction) => void;
  onChange?: (content: string) => void;
}) {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const wordCount = useMemo<WordCount>(() => {
    const words = state.content.trim().split(/\s+/).filter(Boolean).length;
    const chars = state.content.length;
    const lines = state.content.split('\n').length;
    return { words, chars, lines };
  }, [state.content]);

  const matchCount = useMemo(() => {
    if (!state.findQuery) return 0;
    try {
      const regex = new RegExp(state.findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return (state.content.match(regex) || []).length;
    } catch {
      return 0;
    }
  }, [state.content, state.findQuery]);

  const previewHtml = useMemo(() => parseMarkdown(state.content), [state.content]);

  const updateContent = useCallback(
    (newContent: string) => {
      dispatch(macWriteActions.setContent(newContent));
      onChange?.(newContent);
    },
    [dispatch, onChange],
  );

  const updateCursor = useCallback(() => {
    const element = editorRef.current;
    if (!element) return;
    const position = element.selectionStart;
    const before = state.content.slice(0, position);
    const line = (before.match(/\n/g) || []).length + 1;
    const col = position - before.lastIndexOf('\n');
    setCursorPos({ line, col });
  }, [state.content]);

  const handleEditorScroll = useCallback(() => {
    if (!state.scrollSync || !editorRef.current || !previewRef.current) return;
    const editor = editorRef.current;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    const preview = previewRef.current;
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  }, [state.scrollSync]);

  const wrapSelection = useCallback(
    (before: string, after?: string) => {
      const element = editorRef.current;
      if (!element) return;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const selected = state.content.slice(start, end) || 'text';
      const newContent =
        state.content.slice(0, start) +
        before +
        selected +
        (after ?? before) +
        state.content.slice(end);
      updateContent(newContent);
      setTimeout(() => {
        element.focus();
        element.selectionStart = start + before.length;
        element.selectionEnd = start + before.length + selected.length;
      }, 0);
    },
    [state.content, updateContent],
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const element = editorRef.current;
      if (!element) return;
      const start = element.selectionStart;
      updateContent(state.content.slice(0, start) + text + state.content.slice(start));
      setTimeout(() => {
        element.focus();
        element.selectionStart = element.selectionEnd = start + text.length;
      }, 0);
    },
    [state.content, updateContent],
  );

  const prependLine = useCallback(
    (prefix: string) => {
      const element = editorRef.current;
      if (!element) return;
      const start = element.selectionStart;
      const lineStart = state.content.lastIndexOf('\n', start - 1) + 1;
      updateContent(state.content.slice(0, lineStart) + prefix + state.content.slice(lineStart));
      setTimeout(() => {
        element.focus();
        element.selectionStart = element.selectionEnd = start + prefix.length;
      }, 0);
    },
    [state.content, updateContent],
  );

  const execAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'bold':
          wrapSelection('**');
          break;
        case 'italic':
          wrapSelection('*');
          break;
        case 'strikethrough':
          wrapSelection('~~');
          break;
        case 'code':
          wrapSelection('`');
          break;
        case 'codeblock':
          insertAtCursor('\n```\n\n```\n');
          break;
        case 'h1':
          prependLine('# ');
          break;
        case 'h2':
          prependLine('## ');
          break;
        case 'h3':
          prependLine('### ');
          break;
        case 'ul':
          prependLine('- ');
          break;
        case 'ol':
          prependLine('1. ');
          break;
        case 'checkbox':
          prependLine('- [ ] ');
          break;
        case 'quote':
          prependLine('> ');
          break;
        case 'link':
          wrapSelection('[', '](url)');
          break;
        case 'hr':
          insertAtCursor('\n---\n');
          break;
        case 'table':
          insertAtCursor('\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n');
          break;
      }
    },
    [insertAtCursor, prependLine, wrapSelection],
  );

  const cycleViewMode = useCallback(() => {
    dispatch(
      macWriteActions.setViewMode(
        state.viewMode === 'split' ? 'edit' : state.viewMode === 'edit' ? 'preview' : 'split',
      ),
    );
  }, [dispatch, state.viewMode]);

  const handleReplace = () => {
    if (!state.findQuery) return;
    const regex = new RegExp(state.findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    updateContent(state.content.replace(regex, state.replaceQuery));
  };

  const handleReplaceAll = () => {
    if (!state.findQuery) return;
    const regex = new RegExp(state.findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    updateContent(state.content.replace(regex, state.replaceQuery));
  };

  return (
    <div data-part={P.mw}>
      <MacWriteToolbar
        formatActions={FORMAT_ACTIONS}
        viewMode={state.viewMode}
        onExecAction={execAction}
        onToggleFind={() => dispatch(macWriteActions.setShowFind(!state.showFind))}
        onCycleViewMode={cycleViewMode}
      />

      {state.showFind && (
        <MacWriteFindBar
          findQuery={state.findQuery}
          replaceQuery={state.replaceQuery}
          matchCount={matchCount}
          onFindQueryChange={(value) => dispatch(macWriteActions.setFindQuery(value))}
          onReplaceQueryChange={(value) => dispatch(macWriteActions.setReplaceQuery(value))}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => {
            dispatch(macWriteActions.setShowFind(false));
            dispatch(macWriteActions.setFindQuery(''));
          }}
        />
      )}

      <div data-part={P.mwBody}>
        {state.viewMode !== 'preview' && (
          <textarea
            ref={editorRef}
            data-part={P.mwEditor}
            value={state.content}
            onChange={(event) => updateContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'b' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                execAction('bold');
              } else if (event.key === 'i' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                execAction('italic');
              } else if (event.key === 'e' && event.ctrlKey) {
                event.preventDefault();
                execAction('code');
              } else if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                execAction('link');
              } else if (event.key === 'p' && event.ctrlKey && !event.shiftKey) {
                event.preventDefault();
                cycleViewMode();
              } else if (event.key === 'f' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                dispatch(macWriteActions.setShowFind(!state.showFind));
              } else if (event.key === 'Tab') {
                event.preventDefault();
                const element = editorRef.current!;
                const start = element.selectionStart;
                updateContent(state.content.slice(0, start) + '  ' + state.content.slice(start));
                setTimeout(() => {
                  element.selectionStart = element.selectionEnd = start + 2;
                }, 0);
              }
            }}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onScroll={handleEditorScroll}
            spellCheck={false}
          />
        )}
        {state.viewMode === 'split' && <div data-part={P.mwDivider} />}
        {state.viewMode !== 'edit' && (
          <div ref={previewRef} data-part={P.mwPreview} dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </div>

      <WidgetStatusBar>
        <div style={{ display: 'flex', gap: 14 }}>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{wordCount.words} words</span>
          <span>{wordCount.chars} chars</span>
          <span>{wordCount.lines} lines</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span
            onClick={() => dispatch(macWriteActions.setScrollSync(!state.scrollSync))}
            style={{ cursor: 'pointer', opacity: state.scrollSync ? 1 : 0.4 }}
            title="Scroll sync"
          >
            {state.scrollSync ? '🔒' : '🔓'} sync
          </span>
          <span style={{ cursor: 'pointer' }} onClick={cycleViewMode}>
            {state.viewMode === 'split' ? 'Split' : state.viewMode === 'edit' ? 'Edit' : 'Preview'}
          </span>
        </div>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneMacWrite(props: MacWriteProps) {
  const [state, dispatch] = useReducer(macWriteReducer, createInitialSeed(props));
  return <MacWriteFrame state={state} dispatch={dispatch} onChange={props.onChange} />;
}

function ConnectedMacWrite(props: MacWriteProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacWriteState);

  useEffect(() => {
    reduxDispatch(macWriteActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialContent, props.initialViewMode, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <MacWriteFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} onChange={props.onChange} />;
}

export function MacWrite(props: MacWriteProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_WRITE_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacWrite {...props} />;
  }

  return <StandaloneMacWrite {...props} />;
}
