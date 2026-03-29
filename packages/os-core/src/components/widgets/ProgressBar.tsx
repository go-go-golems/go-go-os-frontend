import type { CSSProperties } from 'react';
import { PARTS } from '../../parts';

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  width?: number | string;
  label?: string;
}

export function ProgressBar({ value, width, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const outerStyle: CSSProperties | undefined = width != null ? { width } : undefined;

  return (
    <div
      data-part={PARTS.progressBar}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={outerStyle}
    >
      <div data-part={PARTS.progressBarFill} style={{ width: `${clamped}%` }} />
    </div>
  );
}
