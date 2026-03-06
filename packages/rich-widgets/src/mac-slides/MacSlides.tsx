import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Btn } from '@hypercard/engine';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { CommandPalette, type PaletteItem } from '../primitives/CommandPalette';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { DEFAULT_MARKDOWN } from './sampleData';
import { alignClassName, createDeck, parseSlideDirective, renderBasicMarkdown } from './markdown';
import type { SlideAlignment } from './types';
import {
  createMacSlidesStateSeed,
  macSlidesActions,
  macSlidesReducer,
  MAC_SLIDES_STATE_KEY,
  selectMacSlidesState,
  type MacSlidesAction,
  type MacSlidesState,
} from './macSlidesState';

function cycleAlignment(align: SlideAlignment): SlideAlignment {
  if (align === 'auto') {
    return 'center';
  }
  if (align === 'center') {
    return 'left';
  }
  return 'auto';
}

function replaceCurrentSlideAlignment(markdown: string, slideIndex: number): string {
  const parts = markdown.split(/\n---\n/);
  const index = Math.min(slideIndex, Math.max(parts.length - 1, 0));
  const current = parts[index]?.trimStart() ?? '';
  const parsed = parseSlideDirective(current);
  const nextAlign = cycleAlignment(parsed.align);
  let nextContent = parsed.content.trimStart();

  if (nextAlign !== 'auto') {
    nextContent = `<!-- align: ${nextAlign} -->\n${nextContent}`;
  }

  parts[index] = nextContent;
  return parts.join('\n---\n');
}

function PresentationOverlay({
  slides,
  startIndex,
  onExit,
}: {
  slides: ReturnType<typeof createDeck>['slides'];
  startIndex: number;
  onExit: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit();
      }
      if (event.key === 'ArrowRight' || event.key === ' ') {
        setCurrentIndex((value) => Math.min(value + 1, slides.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setCurrentIndex((value) => Math.max(value - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit, slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <div
      data-part={P.msPresentation}
      onClick={() => setCurrentIndex((value) => Math.min(value + 1, slides.length - 1))}
    >
      <div data-part={P.msPresentationFrame}>
        <div
          className={alignClassName(currentSlide.align)}
          dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(currentSlide.content) }}
        />
      </div>
      <div data-part={P.msPresentationStatus}>
        {currentIndex + 1} / {slides.length} — Press Esc to exit
      </div>
    </div>
  );
}

export interface MacSlidesProps {
  initialMarkdown?: string;
  fileName?: string;
  initialSlide?: number;
  initialShowPalette?: boolean;
  initialShowPresentation?: boolean;
}

function createInitialSeed(props: MacSlidesProps): ReturnType<typeof createMacSlidesStateSeed> {
  return createMacSlidesStateSeed({
    initialMarkdown: props.initialMarkdown ?? DEFAULT_MARKDOWN,
    initialSlide: props.initialSlide,
    paletteOpen: props.initialShowPalette,
    presentationOpen: props.initialShowPresentation,
  });
}

function MacSlidesInner({
  state,
  dispatch,
  fileName,
}: {
  state: MacSlidesState;
  dispatch: (action: MacSlidesAction) => void;
  fileName: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deck = useMemo(() => createDeck(state.markdown), [state.markdown]);
  const safeSlideIndex = Math.min(state.currentSlide, Math.max(deck.slides.length - 1, 0));
  const current = deck.slides[safeSlideIndex];
  const currentAlignment = current?.align ?? 'auto';

  useEffect(() => {
    if (deck.slides.length === 0) {
      if (state.currentSlide !== 0) {
        dispatch(macSlidesActions.setCurrentSlide(0));
      }
      return;
    }

    if (state.currentSlide > deck.slides.length - 1) {
      dispatch(macSlidesActions.setCurrentSlide(Math.max(deck.slides.length - 1, 0)));
    }
  }, [deck.slides.length, dispatch, state.currentSlide]);

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        dispatch(macSlidesActions.setMarkdown(`${state.markdown}${text}`));
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = state.markdown.slice(0, start) + text + state.markdown.slice(end);
      dispatch(macSlidesActions.setMarkdown(next));

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    },
    [dispatch, state.markdown],
  );

  const addNewSlide = useCallback(() => {
    insertAtCursor('\n\n---\n\n# New Slide\n\n');
  }, [insertAtCursor]);

  const toggleAlignment = useCallback(() => {
    dispatch(
      macSlidesActions.setMarkdown(
        replaceCurrentSlideAlignment(state.markdown, safeSlideIndex),
      ),
    );
  }, [dispatch, safeSlideIndex, state.markdown]);

  const actions = useMemo<PaletteItem[]>(
    () => [
      { id: 'new-slide', label: 'New Slide', icon: '➕', shortcut: 'Shift+N' },
      { id: 'prev-slide', label: 'Previous Slide', icon: '◀', shortcut: '←' },
      { id: 'next-slide', label: 'Next Slide', icon: '▶', shortcut: '→' },
      { id: 'toggle-align', label: 'Cycle Alignment', icon: '☰' },
      { id: 'present', label: 'Present', icon: '🖥️', shortcut: '⌘P' },
    ],
    [],
  );

  const executeAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'new-slide':
          addNewSlide();
          break;
        case 'prev-slide':
          dispatch(macSlidesActions.setCurrentSlide(Math.max(0, safeSlideIndex - 1)));
          break;
        case 'next-slide':
          dispatch(
            macSlidesActions.setCurrentSlide(
              Math.min(Math.max(deck.slides.length - 1, 0), safeSlideIndex + 1),
            ),
          );
          break;
        case 'toggle-align':
          toggleAlignment();
          break;
        case 'present':
          if (deck.slides.length > 0) {
            dispatch(macSlidesActions.setPresentationOpen(true));
          }
          break;
      }
    },
    [addNewSlide, deck.slides.length, dispatch, safeSlideIndex, toggleAlignment],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (state.paletteOpen || state.presentationOpen) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        dispatch(macSlidesActions.setPaletteOpen(true));
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        if (deck.slides.length > 0) {
          dispatch(macSlidesActions.setPresentationOpen(true));
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        dispatch(macSlidesActions.setCurrentSlide(Math.max(0, safeSlideIndex - 1)));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        dispatch(
          macSlidesActions.setCurrentSlide(
            Math.min(Math.max(deck.slides.length - 1, 0), safeSlideIndex + 1),
          ),
        );
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [deck.slides.length, dispatch, safeSlideIndex, state.paletteOpen, state.presentationOpen]);

  return (
    <div data-part={P.macSlides}>
      <WidgetToolbar>
        <Btn
          data-part={P.msToolbarButton}
          onClick={() => dispatch(macSlidesActions.setCurrentSlide(Math.max(0, safeSlideIndex - 1)))}
        >
          ◀
        </Btn>
        <Btn data-part={P.msToolbarButton} onClick={addNewSlide}>
          + Slide
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={() => dispatch(macSlidesActions.setPresentationOpen(deck.slides.length > 0))}
        >
          ▶ Present
        </Btn>
        <div data-part={P.msDeckStats}>
          <span>{fileName}</span>
          <span>{deck.slides.length} slides</span>
        </div>
        <div data-part={P.msToolbarSpacer} />
        <span
          data-part={P.msAlignToggle}
          onClick={toggleAlignment}
          title="Cycle alignment: auto → center → left"
        >
          {currentAlignment === 'center'
            ? '☰ Center'
            : currentAlignment === 'left'
              ? '☰ Left'
              : '☰ Auto'}
        </span>
        <Btn
          data-part={P.msToolbarButton}
          onClick={() => dispatch(macSlidesActions.setPaletteOpen(true))}
          style={{ opacity: 0.7 }}
        >
          ⌘P
        </Btn>
      </WidgetToolbar>

      <div data-part={P.msBody}>
        <div data-part={P.msSidebar}>
          <div data-part={P.msSidebarHeader}>Slides</div>
          <div data-part={P.msSlideList}>
            {deck.slides.map((slide, index) => (
              <div
                key={index}
                data-part={P.msSlideThumb}
                data-state={index === safeSlideIndex ? 'active' : undefined}
                onClick={() => dispatch(macSlidesActions.setCurrentSlide(index))}
              >
                <div data-part={P.msSlideThumbPreview}>
                  <div
                    data-part={P.msSlideThumbContent}
                    dangerouslySetInnerHTML={{
                      __html: renderBasicMarkdown(slide.content),
                    }}
                  />
                </div>
                <div data-part={P.msSlideThumbLabel}>Slide {index + 1}</div>
              </div>
            ))}
          </div>
        </div>

        <div data-part={P.msPane} data-state="editor">
          <div data-part={P.msPaneHeader}>
            <span>📝 Markdown Editor</span>
            <span data-part={P.msPaneMeta}>Use `---` to separate slides</span>
          </div>
          <textarea
            ref={textareaRef}
            data-part={P.msEditor}
            value={state.markdown}
            onChange={(event) => dispatch(macSlidesActions.setMarkdown(event.target.value))}
            spellCheck={false}
          />
        </div>

        <div data-part={P.msPane}>
          <div data-part={P.msPaneHeader}>
            <span>🖼️ Slide Preview</span>
            <span data-part={P.msPaneMeta}>
              Slide {safeSlideIndex + 1} of {deck.slides.length}
            </span>
          </div>
          <div data-part={P.msPreviewArea}>
            {current ? (
              <div data-part={P.msSlideFrame}>
                <div
                  className={alignClassName(current.align)}
                  dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(current.content) }}
                />
              </div>
            ) : null}
          </div>
          <div data-part={P.msNavRow}>
            <Btn
              data-part={P.msToolbarButton}
              onClick={() => dispatch(macSlidesActions.setCurrentSlide(Math.max(0, safeSlideIndex - 1)))}
              disabled={safeSlideIndex === 0}
            >
              ◀ Prev
            </Btn>
            <Btn data-part={P.msToolbarButton} onClick={addNewSlide}>
              + Slide
            </Btn>
            <Btn
              data-part={P.msToolbarButton}
              onClick={() => dispatch(macSlidesActions.setPresentationOpen(deck.slides.length > 0))}
            >
              ▶ Present
            </Btn>
            <Btn
              data-part={P.msToolbarButton}
              onClick={() =>
                dispatch(
                  macSlidesActions.setCurrentSlide(
                    Math.min(Math.max(deck.slides.length - 1, 0), safeSlideIndex + 1),
                  ),
                )
              }
              disabled={safeSlideIndex >= deck.slides.length - 1}
            >
              Next ▶
            </Btn>
          </div>
        </div>
      </div>

      <WidgetStatusBar>
        <span>
          {deck.slides.length} slides · {state.markdown.length} characters
        </span>
        <span>
          ←/→ navigate · ⌘P present · ⇧⌘P actions
        </span>
      </WidgetStatusBar>

      {state.paletteOpen && (
        <CommandPalette
          items={actions}
          onSelect={(id) => {
            dispatch(macSlidesActions.setPaletteOpen(false));
            executeAction(id);
          }}
          onClose={() => dispatch(macSlidesActions.setPaletteOpen(false))}
        />
      )}

      {state.presentationOpen && current && (
        <PresentationOverlay
          slides={deck.slides}
          startIndex={safeSlideIndex}
          onExit={() => dispatch(macSlidesActions.setPresentationOpen(false))}
        />
      )}
    </div>
  );
}

function StandaloneMacSlides(props: MacSlidesProps) {
  const [state, dispatch] = useReducer(macSlidesReducer, createInitialSeed(props));

  return (
    <MacSlidesInner
      state={state}
      dispatch={dispatch}
      fileName={props.fileName ?? 'Untitled Presentation'}
    />
  );
}

function ConnectedMacSlides(props: MacSlidesProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectMacSlidesState);

  useEffect(() => {
    reduxDispatch(macSlidesActions.initializeIfNeeded(createInitialSeed(props)));
  }, [
    props.initialMarkdown,
    props.initialShowPalette,
    props.initialShowPresentation,
    props.initialSlide,
    reduxDispatch,
  ]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);

  const dispatch = useCallback(
    (action: MacSlidesAction) => {
      reduxDispatch(action);
    },
    [reduxDispatch],
  );

  return (
    <MacSlidesInner
      state={effectiveState}
      dispatch={dispatch}
      fileName={props.fileName ?? 'Untitled Presentation'}
    />
  );
}

export function MacSlides(props: MacSlidesProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    MAC_SLIDES_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedMacSlides {...props} />;
  }

  return <StandaloneMacSlides {...props} />;
}
