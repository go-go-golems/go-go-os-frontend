import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

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
 * Uses two mechanisms:
 * - useLayoutEffect (runs on every render, catches prop-driven changes before paint)
 * - ResizeObserver (catches descendant reflows that don't trigger a parent re-render)
 *
 * Key-based dedup prevents redundant callbacks.
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

  // Measure on every render (catches prop-driven content changes before paint)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    report(measure(el));
  });

  // ResizeObserver catches descendant reflows (async loads, internal state changes)
  // that don't trigger WindowBody re-render due to memo.
  // Guarded for environments without ResizeObserver (e.g., jsdom in tests).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      report(measure(el));
    });
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
