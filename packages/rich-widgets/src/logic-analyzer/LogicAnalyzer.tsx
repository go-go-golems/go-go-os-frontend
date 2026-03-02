import { useState, useEffect, useRef, useCallback } from 'react';
import { Btn, Checkbox } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { SignalType, TriggerEdge, Protocol, Channel } from './types';
import {
  CHANNEL_COLORS,
  CHANNEL_NAMES,
  SIGNAL_TYPES,
  PROTOCOLS,
} from './types';

// ── Signal generator ─────────────────────────────────────────────────
function generateSignal(
  type: SignalType,
  freq: number,
  t: number,
  phase = 0,
): number {
  const p = (((t * freq + phase) % 1) + 1) % 1;
  switch (type) {
    case 'clock':
      return p < 0.5 ? 1 : 0;
    case 'data_fast':
      return Math.sin((t * freq * 0.7 + phase) * Math.PI * 2) > 0.1 ? 1 : 0;
    case 'data_slow':
      return Math.sin((t * freq * 0.3 + phase) * Math.PI * 2) > -0.2 ? 1 : 0;
    case 'pulse':
      return (p > 0.1 && p < 0.15) || (p > 0.5 && p < 0.55) ? 1 : 0;
    case 'cs':
      return p < 0.7 ? 0 : 1;
    case 'wr':
      return (p > 0.2 && p < 0.35) || (p > 0.6 && p < 0.75) ? 0 : 1;
    case 'rd':
      return (p > 0.05 && p < 0.2) || (p > 0.45 && p < 0.6) ? 0 : 1;
    case 'irq':
      return p > 0.85 && p < 0.95 ? 0 : 1;
    default:
      return 0;
  }
}

// ── Slider control ───────────────────────────────────────────────────
function LaSlider({
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
    <div data-part={RICH_PARTS.laSlider}>
      <span data-part={RICH_PARTS.laSliderLabel}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span data-part={RICH_PARTS.laSliderValue}>
        {value}
        {unit || ''}
      </span>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────
export interface LogicAnalyzerProps {
  canvasWidth?: number;
  canvasHeight?: number;
  autoStart?: boolean;
  initialChannelCount?: number;
}

// ── Component ────────────────────────────────────────────────────────
export function LogicAnalyzer({
  canvasWidth = 560,
  canvasHeight = 340,
  autoStart = true,
  initialChannelCount = 6,
}: LogicAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [running, setRunning] = useState(autoStart);
  const [channels, setChannels] = useState<Channel[]>(() =>
    CHANNEL_NAMES.map((name, i) => ({
      name,
      enabled: i < initialChannelCount,
      color: CHANNEL_COLORS[i],
    })),
  );
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [protocol, setProtocol] = useState<Protocol>('None');
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const [triggerCh, setTriggerCh] = useState(0);
  const [triggerEdge, setTriggerEdge] = useState<TriggerEdge>('rising');
  const [busView, setBusView] = useState(false);

  const enabledChannels = channels.filter((c) => c.enabled);

  const toggleChannel = (idx: number) => {
    setChannels((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, enabled: !c.enabled } : c)),
    );
  };

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

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, W, H);

    const active = enabledChannels;
    const chCount = active.length;
    if (chCount === 0) {
      ctx.fillStyle = '#444';
      ctx.font = 'bold 14px Geneva, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No channels enabled', W / 2, H / 2);
      ctx.textAlign = 'left';
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const laneH = Math.min(56, (H - 30) / chCount);
    const topPad = 2;
    const signalH = laneH * 0.55;

    // Grid
    if (showGrid) {
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 0.5;
      const gridX = W / (12 * zoom);
      for (let x = 0; x < W; x += gridX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let i = 0; i <= chCount; i++) {
        const y = topPad + i * laneH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // Draw each channel
    active.forEach((ch, ci) => {
      const globalIdx = channels.indexOf(ch);
      const baseY = topPad + ci * laneH;
      const highY = baseY + 6;
      const lowY = baseY + 6 + signalH;

      // Lane separator
      ctx.strokeStyle = '#222240';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, baseY + laneH);
      ctx.lineTo(W, baseY + laneH);
      ctx.stroke();

      // Channel label
      ctx.fillStyle = ch.color;
      ctx.font = 'bold 9px Geneva, monospace';
      ctx.globalAlpha = 0.6;
      ctx.fillText(ch.name, 4, lowY + 14);
      ctx.globalAlpha = 1;

      // Signal trace
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      let prevVal: number | null = null;
      for (let x = 0; x < W; x++) {
        const t = (x / W) * 3 * zoom + timeRef.current;
        const val = generateSignal(
          SIGNAL_TYPES[globalIdx],
          speed,
          t,
          globalIdx * 0.17,
        );
        const y = val ? highY : lowY;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          if (prevVal !== null && prevVal !== val) {
            ctx.lineTo(x, y);
            if (showEdges) {
              ctx.fillStyle = ch.color;
              ctx.globalAlpha = 0.3;
              ctx.fillRect(x - 1, highY - 1, 2, signalH + 2);
              ctx.globalAlpha = 1;
            }
          }
          ctx.lineTo(x, y);
        }
        prevVal = val;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Cursor line
    if (cursorPos !== null) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorPos, 0);
      ctx.lineTo(cursorPos, H);
      ctx.stroke();
      ctx.setLineDash([]);

      const cursorTime = (
        (cursorPos / W) * 3 * zoom +
        timeRef.current
      ).toFixed(3);
      ctx.fillStyle = '#000';
      ctx.fillRect(cursorPos + 2, 2, 58, 14);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Geneva, monospace';
      ctx.fillText(`t=${cursorTime}ms`, cursorPos + 5, 12);

      active.forEach((ch, ci) => {
        const globalIdx = channels.indexOf(ch);
        const t = (cursorPos / W) * 3 * zoom + timeRef.current;
        const val = generateSignal(
          SIGNAL_TYPES[globalIdx],
          speed,
          t,
          globalIdx * 0.17,
        );
        const baseY = topPad + ci * laneH;
        ctx.fillStyle = ch.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cursorPos + 2, baseY + 4, 18, 12);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Geneva, monospace';
        ctx.fillText(val ? 'H' : 'L', cursorPos + 6, baseY + 13);
        ctx.globalAlpha = 1;
      });
    }

    // Bus decode bar
    if (busView && active.length >= 2) {
      const busY = H - 22;
      ctx.fillStyle = '#111128';
      ctx.fillRect(0, busY, W, 22);
      ctx.strokeStyle = '#333366';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, busY);
      ctx.lineTo(W, busY);
      ctx.stroke();

      ctx.font = 'bold 9px Geneva, monospace';
      const step = 40;
      for (let x = 0; x < W; x += step) {
        const t = (x / W) * 3 * zoom + timeRef.current;
        let busVal = 0;
        active.forEach((ch, ci) => {
          const globalIdx = channels.indexOf(ch);
          const val = generateSignal(
            SIGNAL_TYPES[globalIdx],
            speed,
            t,
            globalIdx * 0.17,
          );
          busVal |= val << ci;
        });
        const hex = busVal.toString(16).toUpperCase().padStart(2, '0');
        ctx.fillStyle = '#ffe041';
        ctx.globalAlpha = 0.7;
        ctx.fillText(`0x${hex}`, x + 4, busY + 14);
        ctx.globalAlpha = 1;
      }
    }

    // Timing info
    ctx.fillStyle = '#555';
    ctx.font = 'bold 9px Geneva, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${(timeRef.current * 1000).toFixed(0)}\u03BCs`, W - 6, 12);
    ctx.textAlign = 'left';

    if (running) {
      timeRef.current += 0.008 * speed;
    }
    animRef.current = requestAnimationFrame(draw);
  }, [
    channels,
    enabledChannels,
    running,
    speed,
    zoom,
    showGrid,
    showEdges,
    cursorPos,
    busView,
    canvasWidth,
    canvasHeight,
  ]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    setCursorPos(Math.round((e.clientX - rect.left) * scaleX));
  };

  return (
    <div data-part={RICH_PARTS.logicAnalyzer}>
      {/* ── Display + Controls ── */}
      <div data-part={RICH_PARTS.laMain}>
        {/* Canvas display */}
        <div data-part={RICH_PARTS.laDisplay}>
          <div data-part={RICH_PARTS.laBezel}>
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setCursorPos(null)}
            />
            <div data-part={RICH_PARTS.laBezelReflection} />
          </div>
          <div data-part={RICH_PARTS.laDisplayStatus}>
            <span>
              {running ? '\u25B6 CAPTURING' : '\u23F8 STOPPED'} |{' '}
              {enabledChannels.length} CH Active | Depth: 64K samples
            </span>
            <span>
              Trigger: {CHANNEL_NAMES[triggerCh]}{' '}
              {triggerEdge === 'rising' ? '\u2191' : '\u2193'} | Protocol:{' '}
              {protocol}
            </span>
          </div>
        </div>

        {/* Controls panel */}
        <div data-part={RICH_PARTS.laControls}>
          {/* Channels */}
          <div data-part={RICH_PARTS.laControlGroup}>
            <div data-part={RICH_PARTS.laControlGroupTitle}>Channels</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {channels.map((ch, i) => (
                <div
                  key={i}
                  data-part={RICH_PARTS.laChannelRow}
                  style={{ opacity: ch.enabled ? 1 : 0.4 }}
                >
                  <Checkbox
                    checked={ch.enabled}
                    onChange={() => toggleChannel(i)}
                    label=""
                  />
                  <span
                    data-part={RICH_PARTS.laChannelColor}
                    style={{ background: ch.color }}
                  />
                  <span style={{ fontSize: 9, fontWeight: 'bold' }}>
                    {ch.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div data-part={RICH_PARTS.laControlGroup}>
            <div data-part={RICH_PARTS.laControlGroupTitle}>Timing</div>
            <LaSlider
              label="Speed"
              value={speed}
              min={0.1}
              max={5}
              step={0.1}
              onChange={setSpeed}
              unit="x"
            />
            <LaSlider
              label="Zoom"
              value={zoom}
              min={0.2}
              max={4}
              step={0.1}
              onChange={setZoom}
              unit="x"
            />
          </div>

          {/* Trigger */}
          <div data-part={RICH_PARTS.laControlGroup}>
            <div data-part={RICH_PARTS.laControlGroupTitle}>Trigger</div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4, flexWrap: 'wrap' }}>
              {CHANNEL_NAMES.slice(0, 6).map((name, i) => (
                <Btn
                  key={i}
                  onClick={() => setTriggerCh(i)}
                  data-state={triggerCh === i ? 'active' : undefined}
                  style={{ fontSize: 9, padding: '2px 6px' }}
                >
                  {name}
                </Btn>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn
                onClick={() => setTriggerEdge('rising')}
                data-state={triggerEdge === 'rising' ? 'active' : undefined}
                style={{ fontSize: 9, padding: '2px 6px' }}
              >
                {'\u2191'} Rising
              </Btn>
              <Btn
                onClick={() => setTriggerEdge('falling')}
                data-state={triggerEdge === 'falling' ? 'active' : undefined}
                style={{ fontSize: 9, padding: '2px 6px' }}
              >
                {'\u2193'} Falling
              </Btn>
            </div>
          </div>

          {/* Protocol Decode */}
          <div data-part={RICH_PARTS.laControlGroup}>
            <div data-part={RICH_PARTS.laControlGroupTitle}>
              Protocol Decode
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {PROTOCOLS.map((p) => (
                <Btn
                  key={p}
                  onClick={() => setProtocol(p)}
                  data-state={protocol === p ? 'active' : undefined}
                  style={{ fontSize: 9, padding: '2px 6px' }}
                >
                  {p}
                </Btn>
              ))}
            </div>
          </div>

          {/* Display */}
          <div data-part={RICH_PARTS.laControlGroup}>
            <div data-part={RICH_PARTS.laControlGroupTitle}>Display</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Checkbox
                checked={showGrid}
                onChange={() => setShowGrid((v) => !v)}
                label="Grid"
              />
              <Checkbox
                checked={showEdges}
                onChange={() => setShowEdges((v) => !v)}
                label="Edge Markers"
              />
              <Checkbox
                checked={busView}
                onChange={() => setBusView((v) => !v)}
                label="Bus Hex View"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Toolbar ── */}
      <div data-part={RICH_PARTS.laToolbar}>
        <Btn onClick={() => setRunning(!running)} style={{ fontSize: 10 }}>
          {running ? '\u23F8 Stop' : '\u25B6 Capture'}
        </Btn>
        <Btn
          onClick={() => {
            timeRef.current = 0;
          }}
          style={{ fontSize: 10 }}
        >
          {'\u23EE'} Reset
        </Btn>
        <Btn
          onClick={() => {
            setChannels(
              CHANNEL_NAMES.map((name, i) => ({
                name,
                enabled: i < initialChannelCount,
                color: CHANNEL_COLORS[i],
              })),
            );
            setSpeed(1);
            setZoom(1);
            setProtocol('None');
          }}
          style={{ fontSize: 10 }}
        >
          Defaults
        </Btn>
        <span data-part={RICH_PARTS.laSeparator} />
        <Checkbox checked={showGrid} onChange={() => setShowGrid((v) => !v)} label="Grid" />
        <Checkbox
          checked={showEdges}
          onChange={() => setShowEdges((v) => !v)}
          label="Edges"
        />
        <Checkbox checked={busView} onChange={() => setBusView((v) => !v)} label="Bus" />
      </div>
    </div>
  );
}
