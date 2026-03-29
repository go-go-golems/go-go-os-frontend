export type SignalType =
  | 'clock'
  | 'data_fast'
  | 'data_slow'
  | 'pulse'
  | 'cs'
  | 'wr'
  | 'rd'
  | 'irq';

export type TriggerEdge = 'rising' | 'falling';

export type Protocol = 'None' | 'SPI' | 'I²C' | 'UART';

export interface Channel {
  name: string;
  enabled: boolean;
  color: string;
}

export const CHANNEL_COLORS = [
  '#00ff41',
  '#41b0ff',
  '#ff6141',
  '#ffe041',
  '#c841ff',
  '#41ffd0',
  '#ff41b0',
  '#a0ff41',
];

export const CHANNEL_NAMES = ['CLK', 'D0', 'D1', 'D2', 'CS', 'WR', 'RD', 'IRQ'];

export const SIGNAL_TYPES: SignalType[] = [
  'clock',
  'data_fast',
  'data_slow',
  'data_fast',
  'cs',
  'wr',
  'rd',
  'irq',
];

export const PROTOCOLS: Protocol[] = ['None', 'SPI', 'I²C', 'UART'];
