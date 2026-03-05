import * as debugModule from 'debug';

type DebugLogger = (formatter: unknown, ...args: unknown[]) => void;
type DebugFactory = {
  (namespace: string): DebugLogger;
  enable: (pattern: string) => void;
  disable: () => void;
};

const createDebug = ('default' in debugModule ? debugModule.default : debugModule) as unknown as DebugFactory;

interface HypercardDebugController {
  enable: (pattern: string) => void;
  disable: () => void;
  current: () => string;
  help: string;
}

declare global {
  interface Window {
    __HC_DEBUG__?: HypercardDebugController;
  }
}

function readCurrentPattern(): string {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.localStorage?.getItem('debug') ?? '');
  } catch {
    return '';
  }
}

function ensureDebugGlobal(): void {
  if (typeof window === 'undefined') return;
  if (window.__HC_DEBUG__) return;

  window.__HC_DEBUG__ = {
    enable: (pattern: string) => {
      createDebug.enable(String(pattern ?? '').trim());
    },
    disable: () => {
      createDebug.disable();
    },
    current: () => readCurrentPattern(),
    help: "Use window.__HC_DEBUG__.enable('chat:*') or localStorage.debug = 'chat:*'",
  };
}

export function getDebugLogger(namespace: string) {
  ensureDebugGlobal();
  return createDebug(namespace);
}
