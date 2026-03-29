import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';
import { CommandPalette, type PaletteItem } from '../primitives/CommandPalette';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { createDeck } from './markdown';
import {
  EditorPane,
  PresentationOverlay,
  PreviewPane,
  SlideSidebar,
} from './MacSlidesSections';
import {
  macSlidesActions,
  type MacSlidesAction,
  type MacSlidesState,
} from './macSlidesState';
import { replaceCurrentSlideAlignment } from './helpers';
import { useMacSlidesHotkeys } from './useMacSlidesHotkeys';

export function MacSlidesView({
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
  const hasSlides = deck.slides.length > 0;

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
    if (!hasSlides) {
      return;
    }

    dispatch(
      macSlidesActions.setMarkdown(
        replaceCurrentSlideAlignment(state.markdown, safeSlideIndex),
      ),
    );
  }, [dispatch, hasSlides, safeSlideIndex, state.markdown]);

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

  const goPrev = useCallback(() => {
    dispatch(macSlidesActions.setCurrentSlide(Math.max(0, safeSlideIndex - 1)));
  }, [dispatch, safeSlideIndex]);

  const goNext = useCallback(() => {
    dispatch(
      macSlidesActions.setCurrentSlide(
        Math.min(Math.max(deck.slides.length - 1, 0), safeSlideIndex + 1),
      ),
    );
  }, [deck.slides.length, dispatch, safeSlideIndex]);

  const openPresentation = useCallback(() => {
    if (hasSlides) {
      dispatch(macSlidesActions.setPresentationOpen(true));
    }
  }, [dispatch, hasSlides]);

  const executeAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'new-slide':
          addNewSlide();
          break;
        case 'prev-slide':
          goPrev();
          break;
        case 'next-slide':
          goNext();
          break;
        case 'toggle-align':
          toggleAlignment();
          break;
        case 'present':
          openPresentation();
          break;
      }
    },
    [addNewSlide, goNext, goPrev, openPresentation, toggleAlignment],
  );

  useMacSlidesHotkeys({
    paletteOpen: state.paletteOpen,
    presentationOpen: state.presentationOpen,
    openPalette: () => dispatch(macSlidesActions.setPaletteOpen(true)),
    openPresentation,
    goPrev,
    goNext,
  });

  return (
    <div data-part={P.macSlides}>
      <WidgetToolbar>
        <Btn
          data-part={P.msToolbarButton}
          onClick={goPrev}
          disabled={!hasSlides || safeSlideIndex === 0}
        >
          ◀
        </Btn>
        <Btn data-part={P.msToolbarButton} onClick={addNewSlide}>
          + Slide
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={openPresentation}
          disabled={!hasSlides}
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
          data-disabled={!hasSlides ? 'true' : undefined}
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
          data-part={P.msPaletteButton}
          onClick={() => dispatch(macSlidesActions.setPaletteOpen(true))}
        >
          ⌘P
        </Btn>
      </WidgetToolbar>

      <div data-part={P.msBody}>
        <SlideSidebar
          slides={deck.slides}
          selectedIndex={safeSlideIndex}
          onSelect={(index) => dispatch(macSlidesActions.setCurrentSlide(index))}
        />
        <EditorPane
          textareaRef={textareaRef}
          markdown={state.markdown}
          onChange={(value) => dispatch(macSlidesActions.setMarkdown(value))}
        />
        <PreviewPane
          current={current}
          safeSlideIndex={safeSlideIndex}
          totalSlides={deck.slides.length}
          onPrev={goPrev}
          onNext={goNext}
          onAddSlide={addNewSlide}
          onPresent={openPresentation}
        />
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
