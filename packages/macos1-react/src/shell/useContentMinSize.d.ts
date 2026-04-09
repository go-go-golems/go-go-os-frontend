import { type RefObject } from 'react';
export interface ContentMinSize {
    minW: number;
    minH: number;
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
export declare function useContentMinSize(onMinSize?: (size: ContentMinSize) => void): RefObject<HTMLDivElement | null>;
//# sourceMappingURL=useContentMinSize.d.ts.map