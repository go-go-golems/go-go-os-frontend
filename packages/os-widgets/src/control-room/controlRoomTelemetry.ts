import type { LogLine } from './types';

export interface ControlRoomTelemetry {
  temp: number;
  pressure: number;
  rpm: number;
  flow: number;
  load: number;
  cpu: number;
  mem: number;
  net: number;
  disk: number;
}

function noise(seed: number, scale: number): number {
  return Math.sin(seed * 12.9898) * scale;
}

export function deriveTelemetry(
  tick: number,
  knobVal: number,
  knob2: number,
): ControlRoomTelemetry {
  return {
    temp: 42 + Math.sin(tick * 0.05) * 18 + noise(tick + 1, 2.5),
    pressure: 60 + Math.sin(tick * 0.03) * 25 + noise(tick + 2, 4),
    rpm: 2000 + Math.sin(tick * 0.02) * 800 + noise(tick + 3, 80),
    flow: knobVal * 0.95 + noise(tick + 4, 3),
    load: knob2 * 1.1 + noise(tick + 5, 2),
    cpu: 30 + Math.sin(tick * 0.07) * 25 + noise(tick + 6, 5),
    mem: 55 + Math.sin(tick * 0.04) * 15 + noise(tick + 7, 3),
    net: 20 + Math.sin(tick * 0.09) * 18 + noise(tick + 8, 4),
    disk: 40 + Math.sin(tick * 0.01) * 10 + noise(tick + 9, 2),
  };
}

export function createScopeSample(tick: number): number {
  return Math.sin(tick * 0.15) * 0.7 + noise(tick + 10, 0.12);
}

const LOG_MESSAGES: Omit<LogLine, 'time'>[] = [
  { msg: 'SYS: Telemetry nominal', type: 'ok' },
  { msg: 'PUMP: Flow rate adjusted', type: 'ok' },
  { msg: 'WARN: Pressure approaching limit', type: 'warn' },
  { msg: 'NET: Packet loss detected (0.2%)', type: 'warn' },
  { msg: 'SYS: Checkpoint saved', type: 'ok' },
  { msg: 'THERM: Coolant temp within range', type: 'ok' },
];

export function createTickLog(tick: number): LogLine | null {
  if (tick === 0 || tick % 5 !== 0) {
    return null;
  }
  const base = LOG_MESSAGES[tick % LOG_MESSAGES.length];
  const totalSeconds = tick * 0.4;
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return {
    time: `${hours}:${minutes}:${seconds}`,
    ...base,
  };
}
