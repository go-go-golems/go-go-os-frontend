import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Btn, Checkbox } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import { Sparkline } from '../primitives/Sparkline';
import { type LogEntry, type LogLevel, LOG_LEVELS, ALL_LOG_LEVELS } from './types';
import { generateLogEntry } from './sampleData';

// ── Format helpers ───────────────────────────────────────────────────
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

// ── Props ────────────────────────────────────────────────────────────
export interface LogViewerProps {
  initialLogs?: LogEntry[];
  /** Enable live streaming of new log entries */
  streaming?: boolean;
  /** Interval in ms between streamed entries (default: 800) */
  streamInterval?: number;
}

// ── Component ────────────────────────────────────────────────────────
export function LogViewer({
  initialLogs = [],
  streaming: initialStreaming = false,
  streamInterval = 800,
}: LogViewerProps) {
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [levels, setLevels] = useState<Set<LogLevel>>(() => new Set(ALL_LOG_LEVELS));
  const [serviceFilter, setServiceFilter] = useState('All');
  const [selected, setSelected] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [streaming, setStreaming] = useState(initialStreaming);
  const [compactMode, setCompactMode] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Streaming ──
  useEffect(() => {
    if (!streaming) {
      if (streamRef.current) clearInterval(streamRef.current);
      return;
    }
    streamRef.current = setInterval(() => {
      setLiveLogs((prev) => {
        const entry = generateLogEntry(prev.length, new Date());
        return [...prev, entry];
      });
    }, streamInterval + Math.random() * (streamInterval * 0.5));
    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, [streaming, streamInterval]);

  // ── Auto-scroll ──
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [liveLogs, autoScroll]);

  // ── Toggle level filter ──
  const toggleLevel = useCallback((level: LogLevel) => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  // ── Filtered logs ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return liveLogs.filter((log) => {
      if (!levels.has(log.level)) return false;
      if (serviceFilter !== 'All' && log.service !== serviceFilter) return false;
      if (
        q &&
        !log.message.toLowerCase().includes(q) &&
        !log.service.toLowerCase().includes(q) &&
        !log.requestId.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [liveLogs, levels, serviceFilter, search]);

  // ── Selected log detail ──
  const selectedLog = useMemo(() => liveLogs.find((l) => l.id === selected), [liveLogs, selected]);

  // ── Level counts ──
  const levelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of ALL_LOG_LEVELS) c[l] = 0;
    for (const log of liveLogs) c[log.level]++;
    return c;
  }, [liveLogs]);

  // ── Sparkline data ──
  const sparkData = useMemo(() => {
    const buckets = 30;
    const data = new Array(buckets).fill(0) as number[];
    if (filtered.length < 2) return data;
    const first = filtered[0].timestamp.getTime();
    const last = filtered[filtered.length - 1].timestamp.getTime();
    const range = last - first || 1;
    for (const l of filtered) {
      const idx = Math.min(
        buckets - 1,
        Math.floor(((l.timestamp.getTime() - first) / range) * buckets),
      );
      data[idx]++;
    }
    return data;
  }, [filtered]);

  // ── Service list ──
  const services = useMemo(() => {
    const set = new Set(liveLogs.map((l) => l.service));
    return ['All', ...Array.from(set).sort()];
  }, [liveLogs]);

  // ── Scroll handler ──
  const onScrollList = useCallback(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (!atBottom && autoScroll) setAutoScroll(false);
  }, [autoScroll]);

  return (
    <div
      data-part={RICH_PARTS.logViewer}
      data-state={compactMode ? 'compact' : undefined}
    >
      {/* ── Left Sidebar ── */}
      <div data-part={RICH_PARTS.logViewerSidebar}>
        {/* Level Filters */}
        <div data-part={RICH_PARTS.logViewerFilterGroup}>
          <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
            Log Levels
          </div>
          {ALL_LOG_LEVELS.map((level) => (
            <div
              key={level}
              data-part={RICH_PARTS.logViewerFilterItem}
              onClick={() => toggleLevel(level)}
            >
              <Checkbox
                label=""
                checked={levels.has(level)}
                onChange={() => toggleLevel(level)}
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

        {/* Service Filter */}
        <div data-part={RICH_PARTS.logViewerFilterGroup}>
          <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
            Services
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {services.map((svc) => (
              <div
                key={svc}
                data-part={RICH_PARTS.logViewerFilterItem}
                data-state={serviceFilter === svc ? 'selected' : undefined}
                onClick={() => setServiceFilter(svc)}
                style={{
                  fontSize: 10,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {svc === 'All' ? '🌐 All services' : `📡 ${svc}`}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div data-part={RICH_PARTS.logViewerControls}>
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
              borderTop: `1px solid var(--hc-color-border)`,
              paddingTop: 6,
              marginTop: 2,
            }}
          >
            <Btn
              onClick={() => {
                setLiveLogs(initialLogs);
                setSelected(null);
              }}
              style={{ width: '100%', fontSize: 9 }}
            >
              🗑️ Clear & Reset
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Center: Log Stream ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Search + Activity */}
        <div data-part={RICH_PARTS.logViewerToolbar}>
          <div data-part={RICH_PARTS.logViewerSearch}>
            <span style={{ fontSize: 12 }}>🔍</span>
            <input
              data-part="field-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs by message, service, or request ID..."
              style={{ flex: 1 }}
            />
            {search && (
              <Btn onClick={() => setSearch('')} style={{ fontSize: 9 }}>
                ✕
              </Btn>
            )}
            <div
              style={{
                borderLeft: `2px solid var(--hc-color-border)`,
                paddingLeft: 8,
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {filtered.length} / {liveLogs.length} lines
            </div>
          </div>
          <div data-part={RICH_PARTS.logViewerActivity}>
            <span style={{ fontWeight: 'bold' }}>ACTIVITY:</span>
            <Sparkline data={sparkData} width={200} height={20} />
            <div style={{ flex: 1 }} />
            <span>
              {filtered.length > 0
                ? `${fmtDate(filtered[0].timestamp)} — ${fmtTime(filtered[filtered.length - 1].timestamp)}`
                : 'No logs'}
            </span>
          </div>
        </div>

        {/* Log Table */}
        <div data-part={RICH_PARTS.logViewerTable}>
          <div data-part={RICH_PARTS.logViewerHeader}>
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
              const isSel = selected === log.id;
              const isErr = log.level === 'ERROR' || log.level === 'FATAL';
              const isWarn = log.level === 'WARN';
              const rowState = isSel
                ? 'selected'
                : isErr
                  ? 'error'
                  : isWarn
                    ? 'warning'
                    : undefined;

              return (
                <div
                  key={log.id}
                  data-part={RICH_PARTS.logViewerRow}
                  data-state={rowState}
                  onClick={() => setSelected(isSel ? null : log.id)}
                >
                  <span data-part={RICH_PARTS.logViewerLevelBadge}>
                    {meta.emoji}
                  </span>
                  <span
                    data-part={RICH_PARTS.logViewerCell}
                    style={{ fontSize: compactMode ? 9 : 10, opacity: 0.7 }}
                  >
                    {fmtTime(log.timestamp)}
                  </span>
                  <span
                    data-part={RICH_PARTS.logViewerCell}
                    style={{ fontSize: compactMode ? 9 : 10 }}
                  >
                    {log.service}
                  </span>
                  <span
                    data-part={RICH_PARTS.logViewerCell}
                    style={{
                      whiteSpace: wrapLines ? 'pre-wrap' : 'nowrap',
                      wordBreak: wrapLines ? 'break-all' : undefined,
                    }}
                  >
                    {log.message}
                    {log.stackTrace && !isSel && (
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

          {/* Status bar */}
          <div data-part={RICH_PARTS.logViewerStatusBar}>
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
          </div>
        </div>
      </div>

      {/* ── Right: Inspector ── */}
      <div data-part={RICH_PARTS.logViewerDetail}>
        {selectedLog ? (
          <>
            {/* Header */}
            <div data-part={RICH_PARTS.logViewerDetailHeader}>
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

            {/* Message */}
            <div
              style={{
                padding: '8px 10px',
                borderBottom: `2px solid var(--hc-color-border)`,
              }}
            >
              <div
                style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}
              >
                💬 Message
              </div>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  padding: 6,
                  border: `1px solid var(--hc-color-border)`,
                  background: 'var(--hc-color-alt, #f8f8f8)',
                }}
              >
                {selectedLog.message}
              </div>
            </div>

            {/* Fields */}
            <div style={{ padding: '6px 10px' }}>
              <div
                style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}
              >
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
              ).map(([k, v]) => (
                <div key={k} data-part={RICH_PARTS.logViewerDetailField}>
                  <span style={{ fontWeight: 'bold' }}>{k}</span>
                  <span
                    style={{
                      textAlign: 'right',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* Stack trace */}
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
                <pre data-part={RICH_PARTS.logViewerDetailStack}>
                  {selectedLog.stackTrace}
                </pre>
              </div>
            )}

            {/* Actions */}
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
