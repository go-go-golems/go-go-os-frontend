import { useCallback, useEffect, useRef, useState } from 'react';
import { RICH_PARTS as P } from '../parts';
import { useAnimationLoop } from '../primitives/useAnimationLoop';
import {
  CHANNEL_NAMES,
  SIGNAL_TYPES,
  type Channel,
  type Protocol,
  type SignalType,
  type TriggerEdge,
} from './types';

function generateSignal(
  type: SignalType,
  freq: number,
  time: number,
  phase = 0,
): number {
  const period = (((time * freq + phase) % 1) + 1) % 1;
  switch (type) {
    case 'clock':
      return period < 0.5 ? 1 : 0;
    case 'data_fast':
      return Math.sin((time * freq * 0.7 + phase) * Math.PI * 2) > 0.1 ? 1 : 0;
    case 'data_slow':
      return Math.sin((time * freq * 0.3 + phase) * Math.PI * 2) > -0.2 ? 1 : 0;
    case 'pulse':
      return (period > 0.1 && period < 0.15) || (period > 0.5 && period < 0.55) ? 1 : 0;
    case 'cs':
      return period < 0.7 ? 0 : 1;
    case 'wr':
      return (period > 0.2 && period < 0.35) || (period > 0.6 && period < 0.75) ? 0 : 1;
    case 'rd':
      return (period > 0.05 && period < 0.2) || (period > 0.45 && period < 0.6) ? 0 : 1;
    case 'irq':
      return period > 0.85 && period < 0.95 ? 0 : 1;
    default:
      return 0;
  }
}

export function LogicAnalyzerCanvas({
  canvasWidth,
  canvasHeight,
  channels,
  running,
  speed,
  zoom,
  showGrid,
  showEdges,
  protocol,
  triggerCh,
  triggerEdge,
  busView,
  onResetTimeRef,
}: {
  canvasWidth: number;
  canvasHeight: number;
  channels: Channel[];
  running: boolean;
  speed: number;
  zoom: number;
  showGrid: boolean;
  showEdges: boolean;
  protocol: Protocol;
  triggerCh: number;
  triggerEdge: TriggerEdge;
  busView: boolean;
  onResetTimeRef?: (reset: () => void) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const enabledChannels = channels.filter((channel) => channel.enabled);

  useEffect(() => {
    onResetTimeRef?.(() => {
      timeRef.current = 0;
    });
  }, [onResetTimeRef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvasWidth;
    const logicalHeight = canvasHeight;
    if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    const width = logicalWidth;
    const height = logicalHeight;

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);

    const activeChannels = enabledChannels;
    const channelCount = activeChannels.length;
    if (channelCount === 0) {
      ctx.fillStyle = '#444';
      ctx.font = 'bold 14px Geneva, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No channels enabled', width / 2, height / 2);
      ctx.textAlign = 'left';
      return;
    }

    const laneHeight = Math.min(56, (height - 30) / channelCount);
    const topPadding = 2;
    const signalHeight = laneHeight * 0.55;

    if (showGrid) {
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 0.5;
      const gridWidth = width / (12 * zoom);
      for (let x = 0; x < width; x += gridWidth) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let index = 0; index <= channelCount; index += 1) {
        const y = topPadding + index * laneHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    activeChannels.forEach((channel, channelIndex) => {
      const globalIndex = channels.indexOf(channel);
      const baseY = topPadding + channelIndex * laneHeight;
      const highY = baseY + 6;
      const lowY = baseY + 6 + signalHeight;

      ctx.strokeStyle = '#222240';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, baseY + laneHeight);
      ctx.lineTo(width, baseY + laneHeight);
      ctx.stroke();

      ctx.fillStyle = channel.color;
      ctx.font = 'bold 9px Geneva, monospace';
      ctx.globalAlpha = 0.6;
      ctx.fillText(channel.name, 4, lowY + 14);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = channel.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = channel.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      let previousValue: number | null = null;
      for (let x = 0; x < width; x += 1) {
        const time = (x / width) * 3 * zoom + timeRef.current;
        const value = generateSignal(SIGNAL_TYPES[globalIndex], speed, time, globalIndex * 0.17);
        const y = value ? highY : lowY;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          if (previousValue !== null && previousValue !== value) {
            ctx.lineTo(x, y);
            if (showEdges) {
              ctx.fillStyle = channel.color;
              ctx.globalAlpha = 0.3;
              ctx.fillRect(x - 1, highY - 1, 2, signalHeight + 2);
              ctx.globalAlpha = 1;
            }
          }
          ctx.lineTo(x, y);
        }
        previousValue = value;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    if (cursorPos !== null) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorPos, 0);
      ctx.lineTo(cursorPos, height);
      ctx.stroke();
      ctx.setLineDash([]);

      const cursorTime = ((cursorPos / width) * 3 * zoom + timeRef.current).toFixed(3);
      ctx.fillStyle = '#000';
      ctx.fillRect(cursorPos + 2, 2, 58, 14);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Geneva, monospace';
      ctx.fillText(`t=${cursorTime}ms`, cursorPos + 5, 12);

      activeChannels.forEach((channel, channelIndex) => {
        const globalIndex = channels.indexOf(channel);
        const time = (cursorPos / width) * 3 * zoom + timeRef.current;
        const value = generateSignal(SIGNAL_TYPES[globalIndex], speed, time, globalIndex * 0.17);
        const baseY = topPadding + channelIndex * laneHeight;
        ctx.fillStyle = channel.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cursorPos + 2, baseY + 4, 18, 12);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Geneva, monospace';
        ctx.fillText(value ? 'H' : 'L', cursorPos + 6, baseY + 13);
        ctx.globalAlpha = 1;
      });
    }

    if (busView && activeChannels.length >= 2) {
      const busY = height - 22;
      ctx.fillStyle = '#111128';
      ctx.fillRect(0, busY, width, 22);
      ctx.strokeStyle = '#333366';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, busY);
      ctx.lineTo(width, busY);
      ctx.stroke();

      ctx.font = 'bold 9px Geneva, monospace';
      for (let x = 0; x < width; x += 40) {
        const time = (x / width) * 3 * zoom + timeRef.current;
        let busValue = 0;
        activeChannels.forEach((channel, channelIndex) => {
          const globalIndex = channels.indexOf(channel);
          const value = generateSignal(SIGNAL_TYPES[globalIndex], speed, time, globalIndex * 0.17);
          busValue |= value << channelIndex;
        });
        ctx.fillStyle = '#ffe041';
        ctx.globalAlpha = 0.7;
        ctx.fillText(`0x${busValue.toString(16).toUpperCase().padStart(2, '0')}`, x + 4, busY + 14);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = '#555';
    ctx.font = 'bold 9px Geneva, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${(timeRef.current * 1000).toFixed(0)}μs`, width - 6, 12);
    ctx.textAlign = 'left';

    if (running) {
      timeRef.current += 0.008 * speed;
    }
  }, [busView, canvasHeight, canvasWidth, channels, cursorPos, enabledChannels, running, showEdges, showGrid, speed, zoom]);

  useAnimationLoop(draw, true);

  return (
    <div data-part={P.laDisplay}>
      <div data-part={P.laBezel}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onMouseMove={(event) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            setCursorPos(Math.round((event.clientX - rect.left) * scaleX));
          }}
          onMouseLeave={() => setCursorPos(null)}
        />
        <div data-part={P.laBezelReflection} />
      </div>
      <div data-part={P.laDisplayStatus}>
        <span>
          {running ? '▶ CAPTURING' : '⏸ STOPPED'} | {enabledChannels.length} CH Active | Depth: 64K samples
        </span>
        <span>
          Trigger: {CHANNEL_NAMES[triggerCh]} {triggerEdge === 'rising' ? '↑' : '↓'} | Protocol: {protocol}
        </span>
      </div>
    </div>
  );
}
