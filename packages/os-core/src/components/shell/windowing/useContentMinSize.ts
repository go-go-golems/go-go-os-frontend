import { type RefObject, useLayoutEffect, useRef } from 'react';

export interface ContentMinSize {
  minW: number;
  minH: number;
}

function measure(el: HTMLElement): ContentMinSize {
  const savedWidth = el.style.width;
  el.style.width = '0px';
  const minW = el.scrollWidth;
  el.style.width = savedWidth;

  const savedHeight = el.style.height;
  el.style.height = '0px';
  const minH = el.scrollHeight;
  el.style.height = savedHeight;

  return { minW, minH };
}

/**
 * Measures the intrinsic minimum size of a container by temporarily setting
 * its width/height to 0 and reading scrollWidth/scrollHeight.
 *
 * This is intentionally a one-shot measurement on mount.
 *
 * The shell uses it to establish an initial content-derived minimum floor for a
 * window. After mount, window size is user-driven; content changes do not keep
 * rewriting min-size constraints because that creates resize feedback loops for
 * height: 100% / flex / grid layouts.
 */
export function useContentMinSize(
  onMinSize?: (size: ContentMinSize) => void,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const lastReportedRef = useRef('');
  const onMinSizeRef = useRef(onMinSize);
  onMinSizeRef.current = onMinSize;

  function report(size: ContentMinSize) {
    const key = `${size.minW}:${size.minH}`;
    if (key !== lastReportedRef.current) {
      lastReportedRef.current = key;
      onMinSizeRef.current?.(size);
    }
  }

  // Measure once on mount so the shell has an initial floor before paint settles.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    report(measure(el));
  }, []);

  return ref;
}
