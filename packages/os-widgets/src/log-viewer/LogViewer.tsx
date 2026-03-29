import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Btn, Checkbox } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { Sparkline } from '../primitives/Sparkline';
import { type LogEntry, type LogLevel, LOG_LEVELS, ALL_LOG_LEVELS } from './types';
import { generateLogEntry } from './sampleData';
import {
  createLogViewerStateSeed,
  deserializeLogEntry,
  LOG_VIEWER_STATE_KEY,
  logViewerActions,
  selectLogViewerState,
  serializeLogEntry,
} from './logViewerState';

function fmtTime(d: Date): string {
  return (
    d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export interface LogViewerProps {
  initialLogs?: LogEntry[];
  streaming?: boolean;
  streamInterval?: number;
}

interface LogViewerModel {
  liveLogs: LogEntry[];
  search: string;
  levels: ReadonlySet<LogLevel>;
  serviceFilter: string;
  selectedId: number | null;
  autoScroll: boolean;
  streaming: boolean;
  compactMode: boolean;
  wrapLines: boolean;
}

interface LogViewerCallbacks {
  appendGeneratedEntry: (entry: LogEntry) => void;
  onReset: () => void;
  setSearch: (value: string) => void;
  toggleLevel: (level: LogLevel) => void;
  setServiceFilter: (value: string) => void;
  setSelectedId: (value: number | null) => void;
  setAutoScroll: (value: boolean) => void;
  setStreaming: (value: boolean) => void;
  setCompactMode: (value: boolean) => void;
  setWrapLines: (value: boolean) => void;
}

function LogViewerFrame({
  model,
  callbacks,
  streamInterval,
}: {
  model: LogViewerModel;
  callbacks: LogViewerCallbacks;
  streamInterval: number;
}) {
  const {
    liveLogs,
    search,
    levels,
    serviceFilter,
    selectedId,
    autoScroll,
    streaming,
    compactMode,
    wrapLines,
  } = model;
  const {
    appendGeneratedEntry,
    onReset,
    setSearch,
    toggleLevel,
    setServiceFilter,
    setSelectedId,
    setAutoScroll,
    setStreaming,
    setCompactMode,
    setWrapLines,
  } = callbacks;
  const listRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!streaming) {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
      return;
    }
    streamRef.current = setInterval(() => {
      appendGeneratedEntry(generateLogEntry(liveLogs.length, new Date()));
    }, streamInterval + Math.random() * (streamInterval * 0.5));
    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, [appendGeneratedEntry, liveLogs.length, streaming, streamInterval]);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [autoScroll, liveLogs]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return liveLogs.filter((log) => {
      if (!levels.has(log.level)) {
        return false;
      }
      if (serviceFilter !== 'All' && log.service !== serviceFilter) {
        return false;
      }
      if (
        query &&
        !log.message.toLowerCase().includes(query) &&
        !log.service.toLowerCase().includes(query) &&
        !log.requestId.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [levels, liveLogs, search, serviceFilter]);

  const selectedLog = useMemo(
    () => liveLogs.find((entry) => entry.id === selectedId),
    [liveLogs, selectedId],
  );

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const level of ALL_LOG_LEVELS) {
      counts[level] = 0;
    }
    for (const log of liveLogs) {
      counts[log.level] += 1;
    }
    return counts;
  }, [liveLogs]);

  const sparkData = useMemo(() => {
    const buckets = 30;
    const data = new Array(buckets).fill(0) as number[];
    if (filtered.length < 2) {
      return data;
    }
    const first = filtered[0].timestamp.getTime();
    const last = filtered[filtered.length - 1].timestamp.getTime();
    const range = last - first || 1;
    for (const log of filtered) {
      const index = Math.min(
        buckets - 1,
        Math.floor(((log.timestamp.getTime() - first) / range) * buckets),
      );
      data[index] += 1;
    }
    return data;
  }, [filtered]);

  const services = useMemo(() => {
    const available = new Set(liveLogs.map((entry) => entry.service));
    return ['All', ...Array.from(available).sort()];
  }, [liveLogs]);

  const onScrollList = useCallback(() => {
    if (!listRef.current) {
      return;
    }
    const element = listRef.current;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
    if (!atBottom && autoScroll) {
      setAutoScroll(false);
    }
  }, [autoScroll, setAutoScroll]);

  return (
    <div
      data-part={P.lv}
      data-state={compactMode ? 'compact' : undefined}
    >
      <div data-part={P.lvSidebar}>
        <div data-part={P.lvFilterGroup}>
          <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
            Log Levels
          </div>
          {ALL_LOG_LEVELS.map((level) => (
            <div
              key={level}
              data-part={P.lvFilterItem}
              onClick={() => toggleLevel(level)}
            >
              <Checkbox
                label=""
                checked={levels.has(level)}
                onChange={() => undefined}
              />
              <span>{LOG_LEVELS[level].emoji}</span>
              <span style={{ fontWeight: 'bold', flex: 1 }}>{level}</span>
              <span
                style={{
                  fontSize: 9,
                  minWidth: 24,
                  textAlign: 'center',
                  opacity: 0.7,
                }}
              >
                {levelCounts[level]}
              </span>
            </div>
          ))}
        </div>

        <div data-part={P.lvFilterGroup}>
          <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
            Services
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {services.map((service) => (
              <div
                key={service}
                data-part={P.lvFilterItem}
                data-state={serviceFilter === service ? 'selected' : undefined}
                onClick={() => setServiceFilter(service)}
                style={{
                  fontSize: 10,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {service === 'All' ? '🌐 All services' : `📡 ${service}`}
              </div>
            ))}
          </div>
        </div>

        <div data-part={P.lvControls}>
          <Btn
            onClick={() => setStreaming(!streaming)}
            active={streaming}
            style={{ width: '100%' }}
          >
            {streaming ? '⏸ Pause Stream' : '▶ Start Stream'}
          </Btn>
          <Checkbox
            checked={autoScroll}
            onChange={() => setAutoScroll(!autoScroll)}
            label="Auto-scroll"
          />
          <Checkbox
            checked={compactMode}
            onChange={() => setCompactMode(!compactMode)}
            label="Compact mode"
          />
          <Checkbox
            checked={wrapLines}
            onChange={() => setWrapLines(!wrapLines)}
            label="Wrap lines"
          />
          <div
            style={{
              borderTop: '1px solid var(--hc-color-border)',
              paddingTop: 6,
              marginTop: 2,
            }}
          >
            <Btn
              onClick={onReset}
              style={{ width: '100%', fontSize: 9 }}
            >
              🗑️ Clear & Reset
            </Btn>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <WidgetToolbar>
          <div data-part={P.lvSearch}>
            <span style={{ fontSize: 12 }}>🔍</span>
            <input
              data-part="field-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter logs by message, service, or request ID..."
              style={{ flex: 1 }}
            />
            {search && (
              <Btn
                onClick={() => setSearch('')}
                style={{ fontSize: 9 }}
              >
                ✕
              </Btn>
            )}
            <div
              style={{
                borderLeft: '2px solid var(--hc-color-border)',
                paddingLeft: 8,
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {filtered.length} / {liveLogs.length} lines
            </div>
          </div>
          <div data-part={P.lvActivity}>
            <span style={{ fontWeight: 'bold' }}>ACTIVITY:</span>
            <Sparkline
              data={sparkData}
              width={200}
              height={20}
            />
            <div style={{ flex: 1 }} />
            <span>
              {filtered.length > 0
                ? `${fmtDate(filtered[0].timestamp)} — ${fmtTime(filtered[filtered.length - 1].timestamp)}`
                : 'No logs'}
            </span>
          </div>
        </WidgetToolbar>

        <div data-part={P.lvTable}>
          <div data-part={P.lvHeader}>
            <span style={{ textAlign: 'center' }}>Lv</span>
            <span>Timestamp</span>
            <span>Service</span>
            <span>Message</span>
          </div>

          <div
            ref={listRef}
            onScroll={onScrollList}
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
          >
            {filtered.map((log) => {
              const meta = LOG_LEVELS[log.level];
              const isSelected = selectedId === log.id;
              const isError = log.level === 'ERROR' || log.level === 'FATAL';
              const isWarning = log.level === 'WARN';
              const rowState = isSelected
                ? 'selected'
                : isError
                  ? 'error'
                  : isWarning
                    ? 'warning'
                    : undefined;

              return (
                <div
                  key={log.id}
                  data-part={P.lvRow}
                  data-state={rowState}
                  onClick={() => setSelectedId(isSelected ? null : log.id)}
                >
                  <span data-part={P.lvLevelBadge}>
                    {meta.emoji}
                  </span>
                  <span
                    data-part={P.lvCell}
                    style={{ fontSize: compactMode ? 9 : 10, opacity: 0.7 }}
                  >
                    {fmtTime(log.timestamp)}
                  </span>
                  <span
                    data-part={P.lvCell}
                    style={{ fontSize: compactMode ? 9 : 10 }}
                  >
                    {log.service}
                  </span>
                  <span
                    data-part={P.lvCell}
                    style={{
                      whiteSpace: wrapLines ? 'pre-wrap' : 'nowrap',
                      wordBreak: wrapLines ? 'break-all' : undefined,
                    }}
                  >
                    {log.message}
                    {log.stackTrace && !isSelected && (
                      <span style={{ opacity: 0.4 }}> [+stack]</span>
                    )}
                  </span>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', opacity: 0.5 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div>No log entries match current filters</div>
              </div>
            )}
          </div>

          <WidgetStatusBar>
            <span>{filtered.length} entries shown</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>Filter: {serviceFilter}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>Levels: {Array.from(levels).join(', ')}</span>
            <div style={{ flex: 1 }} />
            {streaming && (
              <span style={{ animation: 'blink 1s step-end infinite' }}>
                ● STREAMING
              </span>
            )}
            {autoScroll && <span>📌 AUTO-SCROLL</span>}
          </WidgetStatusBar>
        </div>
      </div>

      <div data-part={P.lvDetail}>
        {selectedLog ? (
          <>
            <div data-part={P.lvDetailHeader}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>
                  {LOG_LEVELS[selectedLog.level].emoji}
                </span>
                <span style={{ fontWeight: 'bold', fontSize: 13 }}>
                  {selectedLog.level}
                </span>
              </div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {fmtDate(selectedLog.timestamp)} {fmtTime(selectedLog.timestamp)}
              </div>
            </div>

            <div
              style={{
                padding: '8px 10px',
                borderBottom: '2px solid var(--hc-color-border)',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
                💬 Message
              </div>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  padding: 6,
                  border: '1px solid var(--hc-color-border)',
                  background: 'var(--hc-color-alt, #f8f8f8)',
                }}
              >
                {selectedLog.message}
              </div>
            </div>

            <div style={{ padding: '6px 10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
                📋 Fields
              </div>
              {(
                [
                  ['Service', `📡 ${selectedLog.service}`],
                  ['Request ID', selectedLog.requestId],
                  ['PID', String(selectedLog.pid)],
                  ['Host', selectedLog.metadata.host],
                  ['Region', selectedLog.metadata.region],
                  ['Version', selectedLog.metadata.version],
                ] as const
              ).map(([key, value]) => (
                <div
                  key={key}
                  data-part={P.lvDetailField}
                >
                  <span style={{ fontWeight: 'bold' }}>{key}</span>
                  <span
                    style={{
                      textAlign: 'right',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {selectedLog.stackTrace && (
              <div style={{ padding: '6px 10px' }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: 10,
                    marginBottom: 4,
                    color: 'var(--hc-color-error)',
                  }}
                >
                  🚫 Stack Trace
                </div>
                <pre data-part={P.lvDetailStack}>
                  {selectedLog.stackTrace}
                </pre>
              </div>
            )}

            <div
              style={{
                padding: '8px 10px',
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <Btn style={{ fontSize: 9 }}>📋 Copy JSON</Btn>
              <Btn style={{ fontSize: 9 }}>🔍 Find Similar</Btn>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 20,
              opacity: 0.5,
            }}
          >
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
              Click a log entry to
              <br />
              view full details,
              <br />
              metadata, and stack traces.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StandaloneLogViewer({
  initialLogs,
  initialStreaming,
  streamInterval,
}: {
  initialLogs: LogEntry[];
  initialStreaming: boolean;
  streamInterval: number;
}) {
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [levels, setLevels] = useState<Set<LogLevel>>(
    () => new Set(ALL_LOG_LEVELS),
  );
  const [serviceFilter, setServiceFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [streaming, setStreaming] = useState(initialStreaming);
  const [compactMode, setCompactMode] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const toggleLevel = useCallback((level: LogLevel) => {
    setLevels((previous) => {
      const next = new Set(previous);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  const appendGeneratedEntry = useCallback((entry: LogEntry) => {
    setLiveLogs((previous) => [...previous, entry]);
  }, []);

  const onReset = useCallback(() => {
    setLiveLogs(initialLogs);
    setSelectedId(null);
  }, [initialLogs]);

  return (
    <LogViewerFrame
      model={{
        liveLogs,
        search,
        levels,
        serviceFilter,
        selectedId,
        autoScroll,
        streaming,
        compactMode,
        wrapLines,
      }}
      callbacks={{
        appendGeneratedEntry,
        onReset,
        setSearch,
        toggleLevel,
        setServiceFilter,
        setSelectedId,
        setAutoScroll,
        setStreaming,
        setCompactMode,
        setWrapLines,
      }}
      streamInterval={streamInterval}
    />
  );
}

function ConnectedLogViewer({
  initialLogs,
  initialStreaming,
  streamInterval,
}: {
  initialLogs: LogEntry[];
  initialStreaming: boolean;
  streamInterval: number;
}) {
  const dispatch = useDispatch();
  const state = useSelector(selectLogViewerState);

  useEffect(() => {
    dispatch(
      logViewerActions.initializeIfNeeded({
        logs: initialLogs,
        streaming: initialStreaming,
      }),
    );
  }, [dispatch, initialLogs, initialStreaming]);

  const effectiveState = state.initialized
    ? state
    : createLogViewerStateSeed({
        logs: initialLogs,
        streaming: initialStreaming,
      });

  const liveLogs = useMemo(
    () => effectiveState.entries.map(deserializeLogEntry),
    [effectiveState.entries],
  );
  const levels = useMemo(
    () => new Set<LogLevel>(effectiveState.levels),
    [effectiveState.levels],
  );

  const appendGeneratedEntry = useCallback(
    (entry: LogEntry) => {
      dispatch(logViewerActions.appendEntry(serializeLogEntry(entry)));
    },
    [dispatch],
  );

  const toggleLevel = useCallback(
    (level: LogLevel) => {
      dispatch(logViewerActions.toggleLevel(level));
    },
    [dispatch],
  );

  return (
    <LogViewerFrame
      model={{
        liveLogs,
        search: effectiveState.search,
        levels,
        serviceFilter: effectiveState.serviceFilter,
        selectedId: effectiveState.selectedId,
        autoScroll: effectiveState.autoScroll,
        streaming: effectiveState.streaming,
        compactMode: effectiveState.compactMode,
        wrapLines: effectiveState.wrapLines,
      }}
      callbacks={{
        appendGeneratedEntry,
        onReset: () => {
          dispatch(logViewerActions.resetToBaseline());
        },
        setSearch: (value) => {
          dispatch(logViewerActions.setSearch(value));
        },
        toggleLevel,
        setServiceFilter: (value) => {
          dispatch(logViewerActions.setServiceFilter(value));
        },
        setSelectedId: (value) => {
          dispatch(logViewerActions.setSelectedId(value));
        },
        setAutoScroll: (value) => {
          dispatch(logViewerActions.setAutoScroll(value));
        },
        setStreaming: (value) => {
          dispatch(logViewerActions.setStreaming(value));
        },
        setCompactMode: (value) => {
          dispatch(logViewerActions.setCompactMode(value));
        },
        setWrapLines: (value) => {
          dispatch(logViewerActions.setWrapLines(value));
        },
      }}
      streamInterval={streamInterval}
    />
  );
}

export function LogViewer({
  initialLogs = [],
  streaming: initialStreaming = false,
  streamInterval = 800,
}: LogViewerProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const state = store?.getState();
  const hasRegisteredSlice =
    typeof state === 'object' &&
    state !== null &&
    LOG_VIEWER_STATE_KEY in (state as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return (
      <ConnectedLogViewer
        initialLogs={initialLogs}
        initialStreaming={initialStreaming}
        streamInterval={streamInterval}
      />
    );
  }

  return (
    <StandaloneLogViewer
      initialLogs={initialLogs}
      initialStreaming={initialStreaming}
      streamInterval={streamInterval}
    />
  );
}
