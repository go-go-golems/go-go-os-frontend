import { useState, useRef, useCallback, useMemo } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { ViewMode, FormatAction, WordCount } from './types';
import { parseMarkdown } from './markdown';
import { SAMPLE_DOCUMENT } from './sampleData';

// ── Format actions registry ──────────────────────────────────────────
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

// ── Props ────────────────────────────────────────────────────────────
export interface MacWriteProps {
  /** Initial markdown content */
  initialContent?: string;
  /** Initial view mode (default: 'split') */
  initialViewMode?: ViewMode;
  /** Callback when content changes */
  onChange?: (content: string) => void;
}

// ── Component ────────────────────────────────────────────────────────
export function MacWrite({
  initialContent = SAMPLE_DOCUMENT,
  initialViewMode = 'split',
  onChange,
}: MacWriteProps) {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [scrollSync, setScrollSync] = useState(true);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Derived state ──
  const wordCount = useMemo<WordCount>(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    const lines = content.split('\n').length;
    return { words, chars, lines };
  }, [content]);

  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    try {
      const regex = new RegExp(
        findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'gi',
      );
      return (content.match(regex) || []).length;
    } catch {
      return 0;
    }
  }, [content, findQuery]);

  const previewHtml = useMemo(() => parseMarkdown(content), [content]);

  // ── Content updates ──
  const updateContent = useCallback(
    (newContent: string) => {
      setContent(newContent);
      onChange?.(newContent);
    },
    [onChange],
  );

  // ── Cursor position ──
  const updateCursor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = content.slice(0, pos);
    const line = (before.match(/\n/g) || []).length + 1;
    const col = pos - before.lastIndexOf('\n');
    setCursorPos({ line, col });
  }, [content]);

  // ── Scroll sync ──
  const handleEditorScroll = useCallback(() => {
    if (!scrollSync || !editorRef.current || !previewRef.current) return;
    const ed = editorRef.current;
    const ratio = ed.scrollTop / (ed.scrollHeight - ed.clientHeight || 1);
    const pv = previewRef.current;
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
  }, [scrollSync]);

  // ── Text manipulation helpers ──
  const wrapSelection = useCallback(
    (before: string, after?: string) => {
      const el = editorRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = content.slice(start, end) || 'text';
      const newContent =
        content.slice(0, start) +
        before +
        selected +
        (after ?? before) +
        content.slice(end);
      updateContent(newContent);
      setTimeout(() => {
        el.focus();
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + selected.length;
      }, 0);
    },
    [content, updateContent],
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const el = editorRef.current;
      if (!el) return;
      const start = el.selectionStart;
      updateContent(content.slice(0, start) + text + content.slice(start));
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + text.length;
      }, 0);
    },
    [content, updateContent],
  );

  const prependLine = useCallback(
    (prefix: string) => {
      const el = editorRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      updateContent(
        content.slice(0, lineStart) + prefix + content.slice(lineStart),
      );
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + prefix.length;
      }, 0);
    },
    [content, updateContent],
  );

  // ── Execute action ──
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
          insertAtCursor(
            '\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n',
          );
          break;
      }
    },
    [wrapSelection, insertAtCursor, prependLine],
  );

  // ── Keyboard shortcuts ──
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      execAction('bold');
    } else if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      execAction('italic');
    } else if (e.key === 'e' && e.ctrlKey) {
      e.preventDefault();
      execAction('code');
    } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      execAction('link');
    } else if (e.key === 'p' && e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      setViewMode((v) =>
        v === 'split' ? 'edit' : v === 'edit' ? 'preview' : 'split',
      );
    } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowFind((v) => !v);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const el = editorRef.current!;
      const start = el.selectionStart;
      updateContent(content.slice(0, start) + '  ' + content.slice(start));
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      }, 0);
    }
  };

  // ── Find & Replace ──
  const handleReplace = () => {
    if (!findQuery) return;
    const regex = new RegExp(
      findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );
    updateContent(content.replace(regex, replaceQuery));
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const regex = new RegExp(
      findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gi',
    );
    updateContent(content.replace(regex, replaceQuery));
  };

  const cycleViewMode = () => {
    setViewMode((v) =>
      v === 'split' ? 'edit' : v === 'edit' ? 'preview' : 'split',
    );
  };

  return (
    <div data-part={RICH_PARTS.macWrite}>
      {/* ── Toolbar ── */}
      <div data-part={RICH_PARTS.macWriteToolbar}>
        {/* Format buttons */}
        {FORMAT_ACTIONS.slice(0, 4).map((action) => (
          <Btn
            key={action.id}
            onClick={() => execAction(action.id)}
            title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            style={{ fontSize: 11, padding: '2px 6px' }}
          >
            {action.icon}
          </Btn>
        ))}

        <span data-part={RICH_PARTS.macWriteSeparator} />

        {/* Heading buttons */}
        {FORMAT_ACTIONS.filter((a) => a.category === 'heading').map((action) => (
          <Btn
            key={action.id}
            onClick={() => execAction(action.id)}
            title={action.label}
            style={{ fontSize: 11, padding: '2px 6px' }}
          >
            {action.icon}
          </Btn>
        ))}

        <span data-part={RICH_PARTS.macWriteSeparator} />

        {/* Insert buttons */}
        {FORMAT_ACTIONS.filter((a) => a.category === 'insert')
          .slice(0, 4)
          .map((action) => (
            <Btn
              key={action.id}
              onClick={() => execAction(action.id)}
              title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
              style={{ fontSize: 11, padding: '2px 6px' }}
            >
              {action.icon}
            </Btn>
          ))}

        <span data-part={RICH_PARTS.macWriteSeparator} />

        {/* Remaining insert buttons */}
        {FORMAT_ACTIONS.filter((a) => a.category === 'insert')
          .slice(4)
          .map((action) => (
            <Btn
              key={action.id}
              onClick={() => execAction(action.id)}
              title={action.label}
              style={{ fontSize: 11, padding: '2px 6px' }}
            >
              {action.icon}
            </Btn>
          ))}

        <div style={{ flex: 1 }} />

        {/* View controls */}
        <Btn
          onClick={() => setShowFind((v) => !v)}
          title="Find & Replace (Ctrl+F)"
          style={{ fontSize: 11, padding: '2px 6px' }}
        >
          🔍
        </Btn>
        <Btn
          onClick={cycleViewMode}
          title="Toggle View (Ctrl+P)"
          style={{ fontSize: 11, padding: '2px 6px' }}
        >
          {viewMode === 'edit' ? '👁️' : viewMode === 'split' ? '📝' : '📄'}
        </Btn>
      </div>

      {/* ── Find & Replace Bar ── */}
      {showFind && (
        <div data-part={RICH_PARTS.macWriteFindBar}>
          <span style={{ fontSize: 12 }}>🔍</span>
          <input
            data-part="field-input"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find..."
            style={{ width: 140 }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowFind(false);
                setFindQuery('');
              }
            }}
          />
          <input
            data-part="field-input"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace..."
            style={{ width: 140 }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowFind(false);
                setFindQuery('');
              }
            }}
          />
          <Btn onClick={handleReplace} style={{ fontSize: 9 }}>
            Replace
          </Btn>
          <Btn onClick={handleReplaceAll} style={{ fontSize: 9 }}>
            All
          </Btn>
          <span style={{ fontSize: 9, opacity: 0.6 }}>
            {matchCount > 0
              ? `${matchCount} found`
              : findQuery
                ? 'No matches'
                : ''}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <Btn
              onClick={() => {
                setShowFind(false);
                setFindQuery('');
              }}
              style={{ fontSize: 9 }}
            >
              ✕
            </Btn>
          </div>
        </div>
      )}

      {/* ── Editor / Preview ── */}
      <div data-part={RICH_PARTS.macWriteBody}>
        {viewMode !== 'preview' && (
          <textarea
            ref={editorRef}
            data-part={RICH_PARTS.macWriteEditor}
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onScroll={handleEditorScroll}
            spellCheck={false}
          />
        )}
        {viewMode === 'split' && (
          <div data-part={RICH_PARTS.macWriteDivider} />
        )}
        {viewMode !== 'edit' && (
          <div
            ref={previewRef}
            data-part={RICH_PARTS.macWritePreview}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>

      {/* ── Status Bar ── */}
      <div data-part={RICH_PARTS.macWriteStatusBar}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>{wordCount.words} words</span>
          <span>{wordCount.chars} chars</span>
          <span>{wordCount.lines} lines</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span
            onClick={() => setScrollSync((v) => !v)}
            style={{ cursor: 'pointer', opacity: scrollSync ? 1 : 0.4 }}
            title="Scroll sync"
          >
            {scrollSync ? '🔒' : '🔓'} sync
          </span>
          <span style={{ cursor: 'pointer' }} onClick={cycleViewMode}>
            {viewMode === 'split'
              ? 'Split'
              : viewMode === 'edit'
                ? 'Edit'
                : 'Preview'}
          </span>
        </div>
      </div>
    </div>
  );
}
