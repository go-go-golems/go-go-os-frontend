import { useCallback, useEffect, useRef } from 'react';
import { RICH_PARTS as P } from '../parts';
import { useAnimationLoop } from '../primitives/useAnimationLoop';
import type { WaveformType } from './types';

function generateWave(
  type: WaveformType,
  freq: number,
  amp: number,
  time: number,
  offset = 0,
): number {
  const phase = (time * freq + offset) * Math.PI * 2;
  switch (type) {
    case 'sine':
      return Math.sin(phase) * amp;
    case 'square':
      return (Math.sin(phase) > 0 ? 1 : -1) * amp;
    case 'triangle':
      return ((Math.asin(Math.sin(phase)) * 2) / Math.PI) * amp;
    case 'sawtooth':
      return ((phase % (Math.PI * 2)) / Math.PI - 1) * amp;
    case 'noise':
      return (Math.random() * 2 - 1) * amp;
    default:
      return 0;
  }
}

export function OscilloscopeCanvas({
  canvasWidth,
  canvasHeight,
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
  onResetTimeRef,
}: {
  canvasWidth: number;
  canvasHeight: number;
  waveform: WaveformType;
  frequency: number;
  amplitude: number;
  timebase: number;
  offsetY: number;
  running: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  channel2: boolean;
  ch2Freq: number;
  ch2Amp: number;
  phosphor: boolean;
  triggerLevel: number;
  thickness: number;
  onResetTimeRef?: (reset: () => void) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

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
    const midY = height / 2 + offsetY;

    if (phosphor) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
    }

    if (showGrid) {
      ctx.strokeStyle = '#1a3a1a';
      ctx.lineWidth = 0.5;
      const gridX = width / 10;
      const gridY = height / 8;
      for (let index = 0; index <= 10; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * gridX, 0);
        ctx.lineTo(index * gridX, height);
        ctx.stroke();
      }
      for (let index = 0; index <= 8; index += 1) {
        ctx.beginPath();
        ctx.moveTo(0, index * gridY);
        ctx.lineTo(width, index * gridY);
        ctx.stroke();
      }
      ctx.strokeStyle = '#2a5a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    if (showCrosshair) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 0.3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = '#882200';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const triggerY = height / 2 - triggerLevel;
    ctx.moveTo(0, triggerY);
    ctx.lineTo(width, triggerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = thickness;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = thickness * 3;
    ctx.beginPath();
    for (let x = 0; x < width; x += 1) {
      const time = (x / width) * timebase + timeRef.current;
      const y = midY - generateWave(waveform, frequency, amplitude, time);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (channel2) {
      ctx.strokeStyle = '#41b0ff';
      ctx.shadowColor = '#41b0ff';
      ctx.shadowBlur = thickness * 3;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      for (let x = 0; x < width; x += 1) {
        const time = (x / width) * timebase + timeRef.current;
        const y = midY - generateWave('sine', ch2Freq, ch2Amp, time);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`CH1: ${waveform.toUpperCase()} ${frequency.toFixed(1)}Hz`, 8, 14);
    ctx.fillText(`Amp: ${amplitude}% | TB: ${timebase.toFixed(1)}x`, 8, 26);
    if (channel2) {
      ctx.fillStyle = '#41b0ff';
      ctx.fillText(`CH2: SINE ${ch2Freq.toFixed(1)}Hz Amp:${ch2Amp}%`, 8, 38);
    }

    ctx.fillStyle = '#882200';
    ctx.fillText('T', width - 14, triggerY + 4);

    if (running) {
      timeRef.current += 0.012;
    }
  }, [amplitude, canvasHeight, canvasWidth, ch2Amp, ch2Freq, channel2, frequency, offsetY, phosphor, running, showCrosshair, showGrid, thickness, timebase, triggerLevel, waveform]);

  useAnimationLoop(draw, true);

  return (
    <div data-part={P.oscDisplay}>
      <div data-part={P.oscBezel}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>
      <div data-part={P.oscDisplayStatus}>
        <span>{running ? '▶ RUNNING' : '⏸ STOPPED'} | Sample Rate: 44.1kHz</span>
        <span>
          Trigger: {triggerLevel > 0 ? '+' : ''}
          {triggerLevel}mV | Mode: Auto
        </span>
      </div>
    </div>
  );
}
