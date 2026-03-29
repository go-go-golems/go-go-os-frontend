import type { PointerEvent } from 'react';
import { PARTS } from '../../../parts';

export interface WindowResizeHandleProps {
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
}

export function WindowResizeHandle({ onPointerDown }: WindowResizeHandleProps) {
  return (
    <button
      type="button"
      data-part={PARTS.windowingResizeHandle}
      aria-label="Resize window"
      onPointerDown={onPointerDown}
    />
  );
}
