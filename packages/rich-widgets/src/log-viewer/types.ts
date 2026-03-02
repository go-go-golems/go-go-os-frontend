export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogLevelMeta {
  emoji: string;
  rank: number;
}

export const LOG_LEVELS: Record<LogLevel, LogLevelMeta> = {
  TRACE: { emoji: '⚬', rank: 0 },
  DEBUG: { emoji: '🔧', rank: 1 },
  INFO: { emoji: 'ℹ️', rank: 2 },
  WARN: { emoji: '⚠️', rank: 3 },
  ERROR: { emoji: '🚫', rank: 4 },
  FATAL: { emoji: '💀', rank: 5 },
};

export const ALL_LOG_LEVELS: readonly LogLevel[] = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

export interface LogEntryMetadata {
  host: string;
  region: string;
  version: string;
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  requestId: string;
  pid: number;
  stackTrace: string | null;
  metadata: LogEntryMetadata;
}
