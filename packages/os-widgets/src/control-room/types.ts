/** Log line in the event log. */
export interface LogLine {
  time: string;
  msg: string;
  type: 'ok' | 'warn' | 'error';
}

/** Toggle switch states for the control panel. */
export interface SwitchState {
  main: boolean;
  aux: boolean;
  pump: boolean;
  alarm: boolean;
}

export type SwitchKey = keyof SwitchState;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
