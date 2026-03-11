import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { classHighlighter } from '@lezer/highlight';
import { hasRuntimeSurface, registerRuntimeSurface } from '../../plugin-runtime';

export interface CodeEditorWindowProps {
  surfaceId: string;
  initialCode: string;
  onSave?: (surfaceId: string, code: string) => void;
}

export function CodeEditorWindow({ surfaceId, initialCode, onSave }: CodeEditorWindowProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'saved' | 'error'; message?: string }>({ type: 'idle' });
  const [dirty, setDirty] = useState(false);

  // Create editor on mount
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        foldGutter(),
        highlightActiveLine(),
        javascript(),
        syntaxHighlighting(classHighlighter),
        oneDark,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          {
            key: 'Mod-s',
            run: () => {
              // Trigger save via DOM event — picked up by handleSave
              editorRef.current?.dispatchEvent(new CustomEvent('editor-save'));
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setDirty(true);
            setStatus({ type: 'idle' });
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontFamily: 'monospace' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only create once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for Ctrl+S custom event from editor keymap
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const listener = () => handleSaveRef.current();
    el.addEventListener('editor-save', listener);
    return () => el.removeEventListener('editor-save', listener);
  }, []);

  const handleSaveRef = useRef(() => {});
  const handleSave = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;

    const code = view.state.doc.toString();
    try {
      registerRuntimeSurface(surfaceId, code);
      setStatus({ type: 'saved', message: `Injected ${surfaceId} — ${code.length} chars` });
      setDirty(false);
      onSave?.(surfaceId, code);
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [surfaceId, onSave]);

  handleSaveRef.current = handleSave;

  const handleRevert = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: initialCode },
    });
    setDirty(false);
    setStatus({ type: 'idle' });
  }, [initialCode]);

  const isRegistered = hasRuntimeSurface(surfaceId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#282c34' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderBottom: '1px solid #444',
        fontSize: 12, color: '#abb2bf', fontFamily: 'monospace',
      }}>
        <span style={{ fontWeight: 700, color: '#e5c07b' }}>{surfaceId}</span>
        {isRegistered && (
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 3,
            background: '#2d6a4f', color: '#fff', fontWeight: 600,
          }}>
            registered
          </span>
        )}
        {dirty && (
          <span style={{ fontSize: 10, color: '#e5c07b' }}>● modified</span>
        )}
      </div>

      {/* Editor */}
      <div ref={editorRef} style={{ flex: 1, overflow: 'hidden' }} />

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', borderTop: '1px solid #444',
        fontSize: 11, color: '#abb2bf', fontFamily: 'monospace',
      }}>
        <div>
          {status.type === 'saved' && (
            <span style={{ color: '#98c379' }}>✓ {status.message}</span>
          )}
          {status.type === 'error' && (
            <span style={{ color: '#e06c75' }}>✗ {status.message}</span>
          )}
          {status.type === 'idle' && (
            <span style={{ color: '#666' }}>Ctrl+S to save & inject</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleRevert}
            disabled={!dirty}
            style={{
              padding: '3px 10px', fontSize: 11, borderRadius: 3,
              border: '1px solid #555', background: '#3e4451', color: '#abb2bf',
              cursor: dirty ? 'pointer' : 'default', opacity: dirty ? 1 : 0.4,
            }}
          >
            ↻ Revert
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '3px 10px', fontSize: 11, borderRadius: 3,
              border: '1px solid #2d6a4f', background: '#2d6a4f', color: '#fff',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            💾 Save &amp; Inject
          </button>
        </div>
      </div>
    </div>
  );
}
