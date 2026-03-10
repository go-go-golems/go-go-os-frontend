import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { DesktopWindowDef } from './types';

interface ActiveInteraction {
  mode: 'move' | 'resize';
  windowId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  latestX: number;
  latestY: number;
  latestWidth: number;
  latestHeight: number;
}

export interface WindowInteractionConstraints {
  minX?: number;
  minY?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface WindowInteractionControllerOptions {
  getWindowById: (windowId: string) => DesktopWindowDef | undefined;
  onBeginWindowInteraction?: (
    windowId: string,
    mode: 'move' | 'resize',
    initial: { x: number; y: number; width: number; height: number },
  ) => void;
  onMoveWindow: (windowId: string, next: { x: number; y: number }) => void;
  onResizeWindow: (windowId: string, next: { width: number; height: number }) => void;
  onCommitMoveWindow?: (windowId: string, next: { x: number; y: number }) => void;
  onCommitResizeWindow?: (windowId: string, next: { width: number; height: number }) => void;
  onCancelWindowInteraction?: (windowId: string) => void;
  onFocusWindow?: (windowId: string) => void;
  constraints?: WindowInteractionConstraints;
  getMinSizeForWindow?: (windowId: string) => { minWidth: number; minHeight: number } | undefined;
}

export function useWindowInteractionController({
  getWindowById,
  onBeginWindowInteraction,
  onMoveWindow,
  onResizeWindow,
  onCommitMoveWindow,
  onCommitResizeWindow,
  onCancelWindowInteraction,
  onFocusWindow,
  constraints,
  getMinSizeForWindow,
}: WindowInteractionControllerOptions) {
  const activeRef = useRef<ActiveInteraction | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const detachListeners = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const finalizeInteraction = useCallback(
    (result: 'commit' | 'cancel') => {
      const active = activeRef.current;
      detachListeners();
      activeRef.current = null;
      if (!active) return;

      if (result === 'commit') {
        if (active.mode === 'move') {
          onCommitMoveWindow?.(active.windowId, { x: active.latestX, y: active.latestY });
          return;
        }
        onCommitResizeWindow?.(active.windowId, { width: active.latestWidth, height: active.latestHeight });
        return;
      }

      onCancelWindowInteraction?.(active.windowId);
    },
    [detachListeners, onCancelWindowInteraction, onCommitMoveWindow, onCommitResizeWindow],
  );

  const stopInteraction = useCallback(() => {
    finalizeInteraction('cancel');
  }, [finalizeInteraction]);

  useEffect(() => {
    return () => {
      finalizeInteraction('cancel');
    };
  }, [finalizeInteraction]);

  const beginInteraction = useCallback(
    (mode: 'move' | 'resize', windowId: string, event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const target = getWindowById(windowId);
      if (!target || typeof window === 'undefined') {
        return;
      }

      onFocusWindow?.(windowId);
      finalizeInteraction('cancel');
      activeRef.current = {
        mode,
        windowId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: target.x,
        startY: target.y,
        startWidth: target.width,
        startHeight: target.height,
        latestX: target.x,
        latestY: target.y,
        latestWidth: target.width,
        latestHeight: target.height,
      };

      onBeginWindowInteraction?.(windowId, mode, {
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
      });

      const onMove = (moveEvent: PointerEvent) => {
        const active = activeRef.current;
        if (!active || active.windowId !== windowId) {
          return;
        }

        const dx = moveEvent.clientX - active.startClientX;
        const dy = moveEvent.clientY - active.startClientY;

        if (active.mode === 'move') {
          active.latestX = Math.max(constraints?.minX ?? 0, active.startX + dx);
          active.latestY = Math.max(constraints?.minY ?? 0, active.startY + dy);
          onMoveWindow(windowId, { x: active.latestX, y: active.latestY });
          return;
        }

        const perWindow = getMinSizeForWindow?.(active.windowId);
        active.latestWidth = Math.max(perWindow?.minWidth ?? constraints?.minWidth ?? 220, active.startWidth + dx);
        active.latestHeight = Math.max(perWindow?.minHeight ?? constraints?.minHeight ?? 140, active.startHeight + dy);
        onResizeWindow(windowId, {
          width: active.latestWidth,
          height: active.latestHeight,
        });
      };

      const onUp = () => {
        finalizeInteraction('commit');
      };

      const onCancel = () => {
        finalizeInteraction('cancel');
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('blur', onCancel);
      cleanupRef.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('blur', onCancel);
      };
    },
    [
      constraints?.minHeight,
      constraints?.minWidth,
      constraints?.minX,
      constraints?.minY,
      finalizeInteraction,
      getMinSizeForWindow,
      getWindowById,
      onBeginWindowInteraction,
      onFocusWindow,
      onMoveWindow,
      onResizeWindow,
    ],
  );

  const beginMove = useCallback(
    (windowId: string, event: ReactPointerEvent<HTMLElement>) => beginInteraction('move', windowId, event),
    [beginInteraction],
  );

  const beginResize = useCallback(
    (windowId: string, event: ReactPointerEvent<HTMLElement>) => beginInteraction('resize', windowId, event),
    [beginInteraction],
  );

  return {
    beginMove,
    beginResize,
    stopInteraction,
  };
}
