import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import { CommandPalette, type PaletteItem } from '../primitives/CommandPalette';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { DEFAULT_MARKDOWN } from './sampleData';
import { alignClassName, createDeck, parseSlideDirective, renderBasicMarkdown } from './markdown';
import type { SlideAlignment } from './types';

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
}

export function MacSlides({
  initialMarkdown = DEFAULT_MARKDOWN,
  fileName = 'Untitled Presentation',
}: MacSlidesProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deck = useMemo(() => createDeck(markdown), [markdown]);
  const safeSlideIndex = Math.min(currentSlide, Math.max(deck.slides.length - 1, 0));
  const current = deck.slides[safeSlideIndex];
  const currentAlignment = current?.align ?? 'auto';

  useEffect(() => {
    if (currentSlide > deck.slides.length - 1) {
      setCurrentSlide(Math.max(deck.slides.length - 1, 0));
    }
  }, [currentSlide, deck.slides.length]);

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setMarkdown((value) => `${value}${text}`);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = markdown.slice(0, start) + text + markdown.slice(end);
      setMarkdown(next);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    },
    [markdown],
  );

  const addNewSlide = useCallback(() => {
    insertAtCursor('\n\n---\n\n# New Slide\n\n');
  }, [insertAtCursor]);

  const toggleAlignment = useCallback(() => {
    setMarkdown((value) => replaceCurrentSlideAlignment(value, safeSlideIndex));
  }, [safeSlideIndex]);

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
          setCurrentSlide((value) => Math.max(0, value - 1));
          break;
        case 'next-slide':
          setCurrentSlide((value) => Math.min(deck.slides.length - 1, value + 1));
          break;
        case 'toggle-align':
          toggleAlignment();
          break;
        case 'present':
          setShowPresentation(true);
          break;
      }
    },
    [addNewSlide, deck.slides.length, toggleAlignment],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (showPalette || showPresentation) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setShowPalette(true);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setShowPresentation(true);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentSlide((value) => Math.max(0, value - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentSlide((value) => Math.min(deck.slides.length - 1, value + 1));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [deck.slides.length, showPalette, showPresentation]);

  return (
    <div data-part={P.macSlides}>
      <WidgetToolbar>
        <Btn
          data-part={P.msToolbarButton}
          onClick={() => setCurrentSlide((value) => Math.max(0, value - 1))}
        >
          ◀
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={addNewSlide}
        >
          + Slide
        </Btn>
        <Btn
          data-part={P.msToolbarButton}
          onClick={() => setShowPresentation(true)}
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
          onClick={() => setShowPalette(true)}
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
                onClick={() => setCurrentSlide(index)}
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

        <div
          data-part={P.msPane}
          data-state="editor"
        >
          <div data-part={P.msPaneHeader}>
            <span>📝 Markdown Editor</span>
            <span data-part={P.msPaneMeta}>Use `---` to separate slides</span>
          </div>
          <textarea
            ref={textareaRef}
            data-part={P.msEditor}
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
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
              onClick={() => setCurrentSlide((value) => Math.max(0, value - 1))}
              disabled={safeSlideIndex === 0}
            >
              ◀ Prev
            </Btn>
            <Btn
              data-part={P.msToolbarButton}
              onClick={addNewSlide}
            >
              + Slide
            </Btn>
            <Btn
              data-part={P.msToolbarButton}
              onClick={() => setShowPresentation(true)}
            >
              ▶ Present
            </Btn>
            <Btn
              data-part={P.msToolbarButton}
              onClick={() =>
                setCurrentSlide((value) => Math.min(deck.slides.length - 1, value + 1))
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
          {deck.slides.length} slides · {markdown.length} characters
        </span>
        <span>
          ←/→ navigate · ⌘P present · ⇧⌘P actions
        </span>
      </WidgetStatusBar>

      {showPalette && (
        <CommandPalette
          items={actions}
          onSelect={(id) => {
            setShowPalette(false);
            executeAction(id);
          }}
          onClose={() => setShowPalette(false)}
        />
      )}

      {showPresentation && current && (
        <PresentationOverlay
          slides={deck.slides}
          startIndex={safeSlideIndex}
          onExit={() => setShowPresentation(false)}
        />
      )}
    </div>
  );
}
