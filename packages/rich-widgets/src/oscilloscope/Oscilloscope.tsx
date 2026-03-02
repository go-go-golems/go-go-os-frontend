import { useState, useEffect, useRef, useCallback } from 'react';
import { Btn, Checkbox } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { WaveformType } from './types';
import { WAVEFORM_TYPES, WAVEFORM_ICONS } from './types';

// ── Wave generator ───────────────────────────────────────────────────
function generateWave(
  type: WaveformType,
  freq: number,
  amp: number,
  t: number,
  offset = 0,
): number {
  const phase = (t * freq + offset) * Math.PI * 2;
  switch (type) {
    case 'sine':
      return Math.sin(phase) * amp;
    case 'square':
      return (Math.sin(phase) > 0 ? 1 : -1) * amp;
    case 'triangle':
      return ((Math.asin(Math.sin(phase)) * 2) / Math.PI) * amp;
    case 'sawtooth':
      return (((phase % (Math.PI * 2)) / Math.PI - 1) * amp);
    case 'noise':
      return (Math.random() * 2 - 1) * amp;
    default:
      return 0;
  }
}

// ── Slider control ───────────────────────────────────────────────────
function OscSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div data-part={RICH_PARTS.oscSlider}>
      <span data-part={RICH_PARTS.oscSliderLabel}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span data-part={RICH_PARTS.oscSliderValue}>
        {value}
        {unit || ''}
      </span>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────
export interface OscilloscopeProps {
  /** Canvas width in pixels */
  canvasWidth?: number;
  /** Canvas height in pixels */
  canvasHeight?: number;
  /** Initial waveform type */
  initialWaveform?: WaveformType;
  /** Start running immediately */
  autoStart?: boolean;
}

// ── Component ────────────────────────────────────────────────────────
export function Oscilloscope({
  canvasWidth = 520,
  canvasHeight = 300,
  initialWaveform = 'sine',
  autoStart = true,
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [waveform, setWaveform] = useState<WaveformType>(initialWaveform);
  const [frequency, setFrequency] = useState(2.5);
  const [amplitude, setAmplitude] = useState(80);
  const [timebase, setTimebase] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const [showGrid, setShowGrid] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [channel2, setChannel2] = useState(false);
  const [ch2Freq, setCh2Freq] = useState(5);
  const [ch2Amp, setCh2Amp] = useState(40);
  const [phosphor, setPhosphor] = useState(true);
  const [triggerLevel, setTriggerLevel] = useState(0);
  const [thickness, setThickness] = useState(2);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // HiDPI scaling
    const dpr = window.devicePixelRatio || 1;
    const logicalW = canvasWidth;
    const logicalH = canvasHeight;
    if (canvas.width !== logicalW * dpr || canvas.height !== logicalH * dpr) {
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      ctx.scale(dpr, dpr);
    }
    const W = logicalW;
    const H = logicalH;
    const midY = H / 2 + offsetY;

    // CRT fade effect
    if (phosphor) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    }

    // Grid
    if (showGrid) {
      ctx.strokeStyle = '#1a3a1a';
      ctx.lineWidth = 0.5;
      const gridX = W / 10;
      const gridY = H / 8;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridX, 0);
        ctx.lineTo(i * gridX, H);
        ctx.stroke();
      }
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridY);
        ctx.lineTo(W, i * gridY);
        ctx.stroke();
      }
      // Center cross brighter
      ctx.strokeStyle = '#2a5a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
    }

    // Crosshair
    if (showCrosshair) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 0.3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(W, midY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Trigger level line
    ctx.strokeStyle = '#882200';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const trigY = H / 2 - triggerLevel;
    ctx.moveTo(0, trigY);
    ctx.lineTo(W, trigY);
    ctx.stroke();
    ctx.setLineDash([]);

    // CH1 waveform
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = thickness;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = thickness * 3;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const t = (x / W) * timebase + timeRef.current;
      const y = midY - generateWave(waveform, frequency, amplitude, t);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // CH2 waveform
    if (channel2) {
      ctx.strokeStyle = '#41b0ff';
      ctx.shadowColor = '#41b0ff';
      ctx.shadowBlur = thickness * 3;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const t = (x / W) * timebase + timeRef.current;
        const y = midY - generateWave('sine', ch2Freq, ch2Amp, t);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Readout overlay
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `CH1: ${waveform.toUpperCase()} ${frequency.toFixed(1)}Hz`,
      8,
      14,
    );
    ctx.fillText(
      `Amp: ${amplitude}% | TB: ${timebase.toFixed(1)}x`,
      8,
      26,
    );
    if (channel2) {
      ctx.fillStyle = '#41b0ff';
      ctx.fillText(
        `CH2: SINE ${ch2Freq.toFixed(1)}Hz Amp:${ch2Amp}%`,
        8,
        38,
      );
    }

    // Trigger marker
    ctx.fillStyle = '#882200';
    ctx.fillText('T', W - 14, trigY + 4);

    if (running) {
      timeRef.current += 0.012;
    }
    animRef.current = requestAnimationFrame(draw);
  }, [
    waveform,
    frequency,
    amplitude,
    timebase,
    offsetY,
    running,
    showGrid,
    showCrosshair,
    channel2,
    ch2Freq,
    ch2Amp,
    phosphor,
    triggerLevel,
    thickness,
    canvasWidth,
    canvasHeight,
  ]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div data-part={RICH_PARTS.oscilloscope}>
      {/* ── Display + Controls ── */}
      <div data-part={RICH_PARTS.oscMain}>
        {/* CRT Display */}
        <div data-part={RICH_PARTS.oscDisplay}>
          <div data-part={RICH_PARTS.oscBezel}>
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          {/* Status bar below display */}
          <div data-part={RICH_PARTS.oscDisplayStatus}>
            <span>
              {running ? '▶ RUNNING' : '⏸ STOPPED'} | Sample Rate: 44.1kHz
            </span>
            <span>
              Trigger: {triggerLevel > 0 ? '+' : ''}
              {triggerLevel}mV | Mode: Auto
            </span>
          </div>
        </div>

        {/* Controls Panel */}
        <div data-part={RICH_PARTS.oscControls}>
          {/* Waveform selector */}
          <div data-part={RICH_PARTS.oscControlGroup}>
            <div data-part={RICH_PARTS.oscControlGroupTitle}>CH1 Waveform</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {WAVEFORM_TYPES.map((w) => (
                <Btn
                  key={w}
                  onClick={() => setWaveform(w)}
                  data-state={waveform === w ? 'active' : undefined}
                  style={{ fontSize: 9, padding: '2px 6px' }}
                >
                  {WAVEFORM_ICONS[w]} {w.slice(0, 3).toUpperCase()}
                </Btn>
              ))}
            </div>
          </div>

          {/* CH1 Parameters */}
          <div data-part={RICH_PARTS.oscControlGroup}>
            <div data-part={RICH_PARTS.oscControlGroupTitle}>
              CH1 Parameters
            </div>
            <OscSlider
              label="Frequency"
              value={frequency}
              min={0.1}
              max={20}
              step={0.1}
              onChange={setFrequency}
              unit=" Hz"
            />
            <OscSlider
              label="Amplitude"
              value={amplitude}
              min={0}
              max={140}
              step={1}
              onChange={setAmplitude}
              unit="%"
            />
            <OscSlider
              label="Y Offset"
              value={offsetY}
              min={-100}
              max={100}
              step={1}
              onChange={setOffsetY}
              unit=" px"
            />
          </div>

          {/* Horizontal / Trigger */}
          <div data-part={RICH_PARTS.oscControlGroup}>
            <div data-part={RICH_PARTS.oscControlGroupTitle}>
              Horizontal / Trigger
            </div>
            <OscSlider
              label="Time/Div"
              value={timebase}
              min={0.1}
              max={5}
              step={0.1}
              onChange={setTimebase}
              unit="x"
            />
            <OscSlider
              label="Trig Level"
              value={triggerLevel}
              min={-100}
              max={100}
              step={1}
              onChange={setTriggerLevel}
              unit=" mV"
            />
            <OscSlider
              label="Thickness"
              value={thickness}
              min={1}
              max={5}
              step={0.5}
              onChange={setThickness}
              unit=" px"
            />
          </div>

          {/* CH2 */}
          <div
            data-part={RICH_PARTS.oscControlGroup}
            style={{ opacity: channel2 ? 1 : 0.7 }}
          >
            <div
              data-part={RICH_PARTS.oscControlGroupTitle}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>CH2 (Sine)</span>
              <Checkbox
                checked={channel2}
                onChange={setChannel2}
                label="ON"
              />
            </div>
            {channel2 && (
              <>
                <OscSlider
                  label="Frequency"
                  value={ch2Freq}
                  min={0.1}
                  max={20}
                  step={0.1}
                  onChange={setCh2Freq}
                  unit=" Hz"
                />
                <OscSlider
                  label="Amplitude"
                  value={ch2Amp}
                  min={0}
                  max={140}
                  step={1}
                  onChange={setCh2Amp}
                  unit="%"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Toolbar ── */}
      <div data-part={RICH_PARTS.oscToolbar}>
        <Btn
          onClick={() => setRunning(!running)}
          style={{ fontSize: 10 }}
        >
          {running ? '⏸ Stop' : '▶ Run'}
        </Btn>
        <Btn
          onClick={() => {
            timeRef.current = 0;
          }}
          style={{ fontSize: 10 }}
        >
          ⏮ Reset
        </Btn>
        <span data-part={RICH_PARTS.oscSeparator} />
        <Checkbox
          checked={showGrid}
          onChange={setShowGrid}
          label="Grid"
        />
        <Checkbox
          checked={showCrosshair}
          onChange={setShowCrosshair}
          label="Cursor"
        />
        <Checkbox
          checked={phosphor}
          onChange={setPhosphor}
          label="Phosphor"
        />
      </div>
    </div>
  );
}
