import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that runs a requestAnimationFrame loop, calling `callback` on each
 * frame while `active` is true. Automatically cancels on unmount.
 *
 * Returns a `restart` function to resume after the loop was stopped externally.
 */
export function useAnimationLoop(
  callback: () => void,
  active: boolean,
): { restart: () => void } {
  const frameRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const loop = useCallback(() => {
    callbackRef.current();
    frameRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (active) {
      frameRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, loop]);

  const restart = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  return { restart };
}
