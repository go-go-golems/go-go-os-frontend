import { useRef, useEffect, useCallback } from 'react';
import { RICH_PARTS as P } from '../parts';
import type { LogLine } from './types';
import { clamp } from './types';

// ── AnalogGauge ──────────────────────────────────────────────────────

export interface AnalogGaugeProps {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  danger?: number;
  size?: number;
}

export function AnalogGauge({
  value = 0,
  min = 0,
  max = 100,
  label = 'GAUGE',
  unit = '',
  danger = 80,
  size = 160,
}: AnalogGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const r = size / 2;
  const sA = (5 * Math.PI) / 4;
  const eA = (7 * Math.PI) / 4 + Math.PI / 2;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    // Face
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(r, r, r - 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r, r, r - 10, 0, Math.PI * 2);
    ctx.stroke();
    // Tick marks
    const tA = eA - sA;
    for (let i = 0; i <= 10; i++) {
      const a = sA + (i / 10) * tA;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const maj = i % 2 === 0;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = maj ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(r + cos * (r - (maj ? 28 : 22)), r + sin * (r - (maj ? 28 : 22)));
      ctx.lineTo(r + cos * (r - 14), r + sin * (r - 14));
      ctx.stroke();
      if (maj) {
        const v = Math.round(min + (i / 10) * (max - min));
        ctx.fillStyle = v >= danger ? '#f00' : '#000';
        ctx.font = 'bold 10px Monaco,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(v), r + cos * (r - 38), r + sin * (r - 38));
      }
    }
    // Danger arc
    const dF = (danger - min) / (max - min);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r, r, r - 12, sA + dF * tA, eA);
    ctx.stroke();
    // Needle
    const f = clamp((value - min) / (max - min), 0, 1);
    const nA = sA + f * tA;
    const nL = r - 26;
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(nA);
    ctx.fillStyle = value >= danger ? '#f00' : '#000';
    ctx.beginPath();
    ctx.moveTo(nL, 0);
    ctx.lineTo(-8, -3);
    ctx.lineTo(-8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Center hub
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.arc(r, r, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [value, min, max, danger, size, r, sA, eA]);

  return (
    <div data-part={P.crGauge}>
      <div data-part={P.crGaugeCanvas}>
        <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
      </div>
      <div data-part={P.crGaugeLabel}>
        <span data-part={P.crGaugeLabelText}>{label}</span>
        <span data-part={P.crGaugeValue}>
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── BarMeter ─────────────────────────────────────────────────────────

export interface BarMeterProps {
  value?: number;
  max?: number;
  label?: string;
  height?: number;
  danger?: number;
}

export function BarMeter({
  value = 50,
  max = 100,
  label = 'LEVEL',
  height = 140,
  danger = 80,
}: BarMeterProps) {
  const frac = clamp(value / max, 0, 1);
  const isAlert = value >= danger;
  return (
    <div data-part={P.crBarMeter}>
      <span data-part={P.crBarLabel}>{label}</span>
      <div data-part={P.crBarTrack} style={{ height }}>
        <div
          data-part={P.crBarDanger}
          style={{ bottom: `${(danger / max) * 100}%` }}
        />
        <div
          data-part={P.crBarFill}
          data-alert={isAlert || undefined}
          style={{ height: `${frac * 100}%` }}
        />
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            data-part={P.crBarTick}
            data-major={i % 5 === 0 || undefined}
            style={{ bottom: `${(i / 10) * 100}%` }}
          />
        ))}
      </div>
      <span data-part={P.crBarValue}>{Math.round(value)}</span>
    </div>
  );
}

// ── HorizontalBar ────────────────────────────────────────────────────

export interface HorizontalBarProps {
  value?: number;
  max?: number;
  label?: string;
}

export function HorizontalBar({
  value = 50,
  max = 100,
  label = 'PROGRESS',
}: HorizontalBarProps) {
  const frac = clamp(value / max, 0, 1);
  return (
    <div data-part={P.crHBar}>
      <div data-part={P.crHBarHeader}>
        <span data-part={P.crHBarLabel}>{label}</span>
        <span data-part={P.crHBarPct}>{Math.round(frac * 100)}%</span>
      </div>
      <div data-part={P.crHBarTrack}>
        <div data-part={P.crHBarFill} style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
}

// ── LED ──────────────────────────────────────────────────────────────

export interface LEDProps {
  on?: boolean;
  color?: string;
  label?: string;
}

export function LED({ on = false, color = '#00AA00', label = '' }: LEDProps) {
  return (
    <div data-part={P.crLed}>
      <div
        data-part={P.crLedDot}
        data-on={on || undefined}
        style={{
          background: on ? color : '#808080',
          boxShadow: on ? `0 0 4px ${color}` : 'inset 1px 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      {label && <span data-part={P.crLedLabel}>{label}</span>}
    </div>
  );
}

// ── ToggleSwitch ─────────────────────────────────────────────────────

export interface ToggleSwitchProps {
  on: boolean;
  onToggle: () => void;
  label?: string;
}

export function ToggleSwitch({ on, onToggle, label = '' }: ToggleSwitchProps) {
  return (
    <div data-part={P.crToggle}>
      <div
        data-part={P.crToggleTrack}
        data-on={on || undefined}
        onClick={onToggle}
      >
        <div
          data-part={P.crToggleThumb}
          style={{ left: on ? 20 : 1 }}
        />
      </div>
      <span data-part={P.crToggleLabel}>{label}</span>
    </div>
  );
}

// ── SevenSeg ─────────────────────────────────────────────────────────

export interface SevenSegProps {
  value?: string;
  label?: string;
  digits?: number;
}

export function SevenSeg({ value = '0000', label = '', digits = 4 }: SevenSegProps) {
  const display = String(value).padStart(digits, ' ').slice(-digits);
  return (
    <div data-part={P.crSevenSeg}>
      {label && <span data-part={P.crSevenSegLabel}>{label}</span>}
      <div data-part={P.crSevenSegDisplay}>
        {display.split('').map((ch, i) => (
          <span key={i} data-part={P.crSevenSegDigit}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Knob ─────────────────────────────────────────────────────────────

export interface KnobProps {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (v: number) => void;
  label?: string;
  size?: number;
}

export function Knob({
  value = 50,
  min = 0,
  max = 100,
  onChange,
  label = '',
  size = 50,
}: KnobProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);
  const angle = -135 + ((value - min) / (max - min)) * 270;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startVal.current = value;
      e.preventDefault();
    },
    [value],
  );

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dy = startY.current - e.clientY;
      onChange?.(clamp(startVal.current + (dy / 100) * (max - min), min, max));
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [min, max, onChange]);

  return (
    <div data-part={P.crKnob}>
      {label && <span data-part={P.crKnobLabel}>{label}</span>}
      <div
        data-part={P.crKnobDial}
        onMouseDown={handleMouseDown}
        style={{ width: size, height: size }}
      >
        <div
          data-part={P.crKnobPointer}
          style={{
            height: size / 2 - 6,
            transform: `translate(-50%,0) rotate(${angle}deg)`,
          }}
        />
        <div data-part={P.crKnobCenter} />
      </div>
      <span data-part={P.crKnobValue}>{Math.round(value)}</span>
    </div>
  );
}

// ── ScrollLog ────────────────────────────────────────────────────────

export interface ScrollLogProps {
  lines?: LogLine[];
}

export function ScrollLog({ lines = [] }: ScrollLogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);
  return (
    <div ref={ref} data-part={P.crScrollLog}>
      {lines.map((line, i) => (
        <div key={i} data-part={P.crLogLine} data-type={line.type}>
          {line.time} {line.msg}
        </div>
      ))}
    </div>
  );
}

// ── Scope ────────────────────────────────────────────────────────────

export interface ScopeProps {
  data?: number[];
  width?: number;
  height?: number;
  label?: string;
}

export function Scope({
  data = [],
  width = 220,
  height = 80,
  label = 'SCOPE',
}: ScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, width, height);
    // Grid
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Signal trace
    if (data.length > 1) {
      ctx.strokeStyle = '#33FF33';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#33FF33';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * width;
        const y = height / 2 - data[i] * height * 0.4;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Center line
    ctx.strokeStyle = '#1a5a1a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [data, width, height]);

  return (
    <div data-part={P.crScope}>
      <span data-part={P.crScopeLabel}>{label}</span>
      <div data-part={P.crScopeCanvas}>
        <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
      </div>
    </div>
  );
}
