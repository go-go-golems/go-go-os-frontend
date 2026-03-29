import { useEffect, useState, type RefObject } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { createDeck } from './markdown';
import { SlideMarkup } from './SlideMarkup';

export function PresentationOverlay({
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
        <SlideMarkup content={currentSlide.content} align={currentSlide.align} />
      </div>
      <div data-part={P.msPresentationStatus}>
        {currentIndex + 1} / {slides.length} — Press Esc to exit
      </div>
    </div>
  );
}

export function SlideSidebar({
  slides,
  selectedIndex,
  onSelect,
}: {
  slides: ReturnType<typeof createDeck>['slides'];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div data-part={P.msSidebar}>
      <div data-part={P.msSidebarHeader}>Slides</div>
      <div data-part={P.msSlideList}>
        {slides.length === 0 ? (
          <EmptyState
            icon="🗂️"
            message="No slides yet. Add one from the toolbar or command palette."
          />
        ) : (
          slides.map((slide, index) => (
            <div
              key={index}
              data-part={P.msSlideThumb}
              data-state={index === selectedIndex ? 'active' : undefined}
              onClick={() => onSelect(index)}
            >
              <div data-part={P.msSlideThumbPreview}>
                <div data-part={P.msSlideThumbContent}>
                  <SlideMarkup content={slide.content} align={slide.align} />
                </div>
              </div>
              <div data-part={P.msSlideThumbLabel}>Slide {index + 1}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function EditorPane({
  textareaRef,
  markdown,
  onChange,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  markdown: string;
  onChange: (value: string) => void;
}) {
  return (
    <div data-part={P.msPane} data-state="editor">
      <div data-part={P.msPaneHeader}>
        <span>📝 Markdown Editor</span>
        <span data-part={P.msPaneMeta}>Use `---` to separate slides</span>
      </div>
      <textarea
        ref={textareaRef}
        data-part={P.msEditor}
        value={markdown}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={'# New Slide\n\nStart writing here…'}
      />
    </div>
  );
}

export function PreviewPane({
  current,
  safeSlideIndex,
  totalSlides,
  onPrev,
  onNext,
  onAddSlide,
  onPresent,
}: {
  current: ReturnType<typeof createDeck>['slides'][number] | undefined;
  safeSlideIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onAddSlide: () => void;
  onPresent: () => void;
}) {
  return (
    <div data-part={P.msPane}>
      <div data-part={P.msPaneHeader}>
        <span>🖼️ Slide Preview</span>
        <span data-part={P.msPaneMeta}>
          {totalSlides > 0 ? `Slide ${safeSlideIndex + 1} of ${totalSlides}` : 'No slides'}
        </span>
      </div>
      <div data-part={P.msPreviewArea}>
        {current ? (
          <div data-part={P.msSlideFrame}>
            <SlideMarkup content={current.content} align={current.align} />
          </div>
        ) : (
          <EmptyState
            icon="🖼️"
            message="Preview will appear after you create your first slide."
          />
        )}
      </div>
      <div data-part={P.msNavRow}>
        <Btn
          data-part={P.msToolbarButton}
          onClick={onPrev}
          disabled={safeSlideIndex === 0 || totalSlides === 0}
        >
          ◀ Prev
        </Btn>
        <Btn data-part={P.msToolbarButton} onClick={onAddSlide}>
          + Slide
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={onPresent}
          disabled={totalSlides === 0}
        >
          ▶ Present
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={onNext}
          disabled={totalSlides === 0 || safeSlideIndex >= totalSlides - 1}
        >
          Next ▶
        </Btn>
      </div>
    </div>
  );
}
