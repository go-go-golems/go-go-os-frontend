import { Btn } from '@hypercard/engine';
import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { ModalOverlay } from '../primitives/ModalOverlay';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { RICH_PARTS as P } from '../parts';
import { DEFAULT_MERMAID_PRESET, MERMAID_PRESETS } from './sampleData';
import { loadMermaid, renderMermaidDiagram } from './mermaidClient';
import {
  createMermaidEditorStateSeed,
  mermaidEditorActions,
  mermaidEditorReducer,
  MERMAID_EDITOR_STATE_KEY,
  selectMermaidEditorState,
  type MermaidEditorState,
} from './mermaidEditorState';
import type { MermaidPresetId } from './types';

export interface MermaidEditorProps {
  initialCode?: string;
  initialPresetId?: MermaidPresetId;
}

function createInitialSeed(props: MermaidEditorProps): MermaidEditorState {
  return createMermaidEditorStateSeed({
    code: props.initialCode,
    presetId: props.initialPresetId,
  });
}

function MermaidEditorFrame({
  state,
  dispatch,
}: {
  state: MermaidEditorState;
  dispatch: (action: Parameters<typeof mermaidEditorReducer>[1]) => void;
}) {
  const [svgOutput, setSvgOutput] = useState('');
  const [error, setError] = useState('');
  const [mermaidReady, setMermaidReady] = useState(false);
  const renderCounter = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then(() => {
        if (!cancelled) {
          setMermaidReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load Mermaid runtime');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mermaidReady || !state.code.trim()) {
      setSvgOutput('');
      if (mermaidReady) setError('');
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        renderCounter.current += 1;
        const { svg } = await renderMermaidDiagram(
          state.code,
          `mermaid-editor-${renderCounter.current}`,
        );
        setSvgOutput(svg);
        setError('');
      } catch (renderError) {
        const message =
          renderError instanceof Error ? renderError.message : 'Syntax error';
        setError(message);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [mermaidReady, state.code]);

  const exportSvg = useCallback(() => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'diagram.svg';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [svgOutput]);

  const lineCount = useMemo(() => state.code.split('\n').length, [state.code]);
  const charCount = state.code.length;

  return (
    <div data-part={P.mermaidEditor}>
      <WidgetToolbar>
        {MERMAID_PRESETS.map((preset) => (
          <Btn
            key={preset.id}
            onClick={() => {
              dispatch(mermaidEditorActions.setPresetId(preset.id));
              dispatch(mermaidEditorActions.setCode(preset.code));
            }}
            data-state={state.presetId === preset.id ? 'active' : undefined}
            style={{ fontSize: 11 }}
          >
            {preset.label}
          </Btn>
        ))}
        <Separator />
        <Btn onClick={() => dispatch(mermaidEditorActions.setZoom(state.zoom - 0.2))}>
          −
        </Btn>
        <Btn onClick={() => dispatch(mermaidEditorActions.setZoom(1))}>
          {Math.round(state.zoom * 100)}%
        </Btn>
        <Btn onClick={() => dispatch(mermaidEditorActions.setZoom(state.zoom + 0.2))}>
          +
        </Btn>
        <Separator />
        <Btn onClick={exportSvg} disabled={!svgOutput}>
          Export SVG
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn onClick={() => dispatch(mermaidEditorActions.setShowAbout(true))}>
          About
        </Btn>
      </WidgetToolbar>

      <div data-part={P.meBody}>
        <div data-part={P.mePane} style={{ flexBasis: `${state.splitPos * 100}%` }}>
          <div data-part={P.mePaneHeader}>Source</div>
          <textarea
            data-part={P.meEditor}
            value={state.code}
            onChange={(event) => dispatch(mermaidEditorActions.setCode(event.target.value))}
            spellCheck={false}
            placeholder="Enter Mermaid syntax…"
          />
        </div>

        <div
          data-part={P.meSplitter}
          onMouseDown={() => {
            const handleMove = (event: MouseEvent) => {
              const rect = previewRef.current?.parentElement?.getBoundingClientRect();
              if (!rect) return;
              dispatch(
                mermaidEditorActions.setSplitPos(
                  (event.clientX - rect.left) / rect.width,
                ),
              );
            };
            const handleUp = () => {
              window.removeEventListener('mousemove', handleMove);
              window.removeEventListener('mouseup', handleUp);
            };
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
          }}
        />

        <div data-part={P.mePane} style={{ flex: 1 }}>
          <div data-part={P.mePaneHeader}>Preview</div>
          <div ref={previewRef} data-part={P.mePreviewArea}>
            {error ? (
              <div data-part={P.meMessage} data-state="error">
                <strong>Syntax Error</strong>
                <span>{error}</span>
              </div>
            ) : svgOutput ? (
              <div
                data-part={P.meDiagram}
                style={{ transform: `scale(${state.zoom})` }}
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            ) : (
              <div data-part={P.meMessage}>
                {mermaidReady ? 'Type Mermaid syntax to preview' : 'Loading Mermaid…'}
              </div>
            )}
          </div>
        </div>
      </div>

      <WidgetStatusBar>
        <span>{MERMAID_PRESETS.find((preset) => preset.id === state.presetId)?.label ?? DEFAULT_MERMAID_PRESET.label}</span>
        <span>{lineCount} lines</span>
        <span>{charCount} chars</span>
      </WidgetStatusBar>

      {state.showAbout && (
        <ModalOverlay onClose={() => dispatch(mermaidEditorActions.setShowAbout(false))}>
          <div data-part={P.meAbout}>
            <h3>MermaidEditor</h3>
            <p>Diagram editor and previewer for Mermaid syntax.</p>
            <p>State is Redux-seeded for Storybook and launcher sessions.</p>
            <Btn onClick={() => dispatch(mermaidEditorActions.setShowAbout(false))}>
              Close
            </Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function StandaloneMermaidEditorHost(props: MermaidEditorProps) {
  const [state, dispatch] = useReducer(mermaidEditorReducer, createInitialSeed(props));
  const wrappedDispatch = useCallback(
    (action: Parameters<typeof mermaidEditorReducer>[1]) => {
      dispatch(action);
    },
    [dispatch],
  );
  return <MermaidEditorFrame state={state} dispatch={wrappedDispatch} />;
}

function ConnectedMermaidEditor(props: MermaidEditorProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMermaidEditorState);

  useEffect(() => {
    reduxDispatch(mermaidEditorActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialCode, props.initialPresetId, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <MermaidEditorFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function MermaidEditor(props: MermaidEditorProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MERMAID_EDITOR_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMermaidEditor {...props} />;
  }

  return <StandaloneMermaidEditorHost {...props} />;
}
