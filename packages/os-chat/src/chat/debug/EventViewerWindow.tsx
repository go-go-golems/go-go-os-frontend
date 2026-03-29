import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { EventLogEntry } from './eventBus';
import { clearConversationEventHistory, getConversationEvents, subscribeConversationEvents } from './eventBus';
import { SyntaxHighlight } from './SyntaxHighlight';
import { copyTextToClipboard } from './clipboard';
import { toYaml } from './yamlFormat';

const MAX_ENTRIES = 500;
const AUTO_SCROLL_THRESHOLD_PX = 32;
const ALL_FAMILIES = ['llm', 'tool', 'hypercard', 'timeline', 'ws', 'other'] as const;
type Family = (typeof ALL_FAMILIES)[number];

const FAMILY_COLORS: Record<Family, string> = {
  llm: '#3b82f6',
  tool: '#f59e0b',
  hypercard: '#8b5cf6',
  timeline: '#10b981',
  ws: '#ef4444',
  other: '#6b7280',
};

const FAMILY_LABELS: Record<Family, string> = {
  llm: 'LLM',
  tool: 'Tool',
  hypercard: 'HC',
  timeline: 'TL',
  ws: 'WS',
  other: '…',
};

export interface EventViewerWindowProps {
  conversationId: string;
  /** Optional initial entries for storybook/testing */
  initialEntries?: EventLogEntry[];
}

export interface AutoScrollMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  thresholdPx?: number;
}

export function isNearBottom({
  scrollTop,
  clientHeight,
  scrollHeight,
  thresholdPx = AUTO_SCROLL_THRESHOLD_PX,
}: AutoScrollMetrics): boolean {
  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
  return distanceFromBottom <= thresholdPx;
}

export interface EventTypeVisibilityOptions {
  hideLlmDelta: boolean;
  hideThinkingDelta: boolean;
}

export function isEntryHiddenByEventType(eventType: string, options: EventTypeVisibilityOptions): boolean {
  if (options.hideLlmDelta && eventType === 'llm.delta') return true;
  if (options.hideThinkingDelta && eventType === 'llm.thinking.delta') return true;
  return false;
}

export function filterVisibleEntries(
  entries: EventLogEntry[],
  filters: Record<string, boolean>,
  options: EventTypeVisibilityOptions,
): EventLogEntry[] {
  return entries.filter((entry) => {
    if (filters[entry.family] === false) return false;
    return !isEntryHiddenByEventType(entry.eventType, options);
  });
}

export interface VisibleEventsYamlExport {
  fileName: string;
  yaml: string;
}

function toFileSafeSegment(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'conversation';
}

export function buildVisibleEventsYamlExport(
  conversationId: string,
  visibleEntries: EventLogEntry[],
  exportedAtMs = Date.now(),
): VisibleEventsYamlExport {
  const exportedAt = new Date(exportedAtMs).toISOString();
  const timestamp = exportedAt.replace(/[:.]/g, '-');
  const fileName = `events-${toFileSafeSegment(conversationId)}-${timestamp}.yaml`;
  const yaml = toYaml({
    conversationId,
    exportedAt,
    eventCount: visibleEntries.length,
    events: visibleEntries.map((entry) => ({
      timestamp: new Date(entry.timestamp).toISOString(),
      eventType: entry.eventType,
      eventId: entry.eventId,
      family: entry.family,
      summary: entry.summary,
      payload: entry.rawPayload,
    })),
  } as Record<string, unknown>);

  return { fileName, yaml };
}

export function EventViewerWindow({ conversationId, initialEntries }: EventViewerWindowProps) {
  const [entries, setEntries] = useState<EventLogEntry[]>(
    () => initialEntries ?? getConversationEvents(conversationId),
  );
  const [filters, setFilters] = useState<Record<string, boolean>>(() => {
    const f: Record<string, boolean> = {};
    for (const family of ALL_FAMILIES) f[family] = true;
    return f;
  });
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hideLlmDelta, setHideLlmDelta] = useState(false);
  const [hideThinkingDelta, setHideThinkingDelta] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copyFeedbackById, setCopyFeedbackById] = useState<Record<string, 'copied' | 'error'>>({});
  const [exportFeedback, setExportFeedback] = useState<'ok' | 'error' | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Subscribe to conversation event bus
  useEffect(() => {
    setEntries(initialEntries ?? getConversationEvents(conversationId));
    setExpandedIds(new Set());
    setCopyFeedbackById({});
    setExportFeedback(null);
  }, [conversationId, initialEntries]);

  useEffect(() => {
    const unsubscribe = subscribeConversationEvents(conversationId, (entry) => {
      if (pausedRef.current) return;
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
      });
    });
    return unsubscribe;
  }, [conversationId]);

  // Auto-scroll — use entry count as stable dep so window-focus re-renders don't trigger scroll
  const entryCount = entries.length;
  useLayoutEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [entryCount, autoScroll]);

  const visibilityOptions = useMemo<EventTypeVisibilityOptions>(
    () => ({ hideLlmDelta, hideThinkingDelta }),
    [hideLlmDelta, hideThinkingDelta],
  );

  const visible = useMemo(
    () => filterVisibleEntries(entries, filters, visibilityOptions),
    [entries, filters, visibilityOptions],
  );

  const toggleFilter = useCallback((family: string) => {
    setFilters((f) => ({ ...f, [family]: !f[family] }));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearLog = useCallback(() => {
    setEntries([]);
    setExpandedIds(new Set());
    setCopyFeedbackById({});
    if (!initialEntries) {
      clearConversationEventHistory(conversationId);
    }
  }, [conversationId, initialEntries]);

  const handleLogScroll = useCallback(() => {
    if (!autoScroll || !logRef.current) {
      return;
    }
    if (!isNearBottom(logRef.current)) {
      setAutoScroll(false);
    }
  }, [autoScroll]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const followStream = useCallback(() => {
    setAutoScroll(true);
    endRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  const holdPosition = useCallback(() => {
    setAutoScroll(false);
  }, []);
  const copyPayload = useCallback((entryId: string, payloadText: string) => {
    copyTextToClipboard(payloadText)
      .then(() => {
        setCopyFeedbackById((prev) => ({ ...prev, [entryId]: 'copied' }));
      })
      .catch(() => {
        setCopyFeedbackById((prev) => ({ ...prev, [entryId]: 'error' }));
      })
      .finally(() => {
        setTimeout(() => {
          setCopyFeedbackById((prev) => {
            const current = prev[entryId];
            if (!current) {
              return prev;
            }
            const next = { ...prev };
            delete next[entryId];
            return next;
          });
        }, 1400);
      });
  }, []);
  const exportVisibleToYaml = useCallback(() => {
    try {
      const { fileName, yaml } = buildVisibleEventsYamlExport(conversationId, visible);
      const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setExportFeedback('ok');
    } catch {
      setExportFeedback('error');
    } finally {
      setTimeout(() => setExportFeedback(null), 1400);
    }
  }, [conversationId, visible]);

  return (
    <div
      data-part="event-viewer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#333',
      }}
    >
      {/* Filter bar */}
      <div
        data-part="event-viewer-toolbar"
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px 8px',
          borderBottom: '1px solid #ddd',
          background: '#f8f9fa',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {ALL_FAMILIES.map((family) => (
          <button
            key={family}
            data-state={filters[family] ? 'active' : 'inactive'}
            onClick={() => toggleFilter(family)}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              borderRadius: '3px',
              border: `1px solid ${FAMILY_COLORS[family]}`,
              background: filters[family] ? FAMILY_COLORS[family] + '18' : 'transparent',
              color: filters[family] ? FAMILY_COLORS[family] : '#999',
              cursor: 'pointer',
            }}
          >
            {FAMILY_LABELS[family]}
          </button>
        ))}
        <label style={toggleLabelStyle} title="Hide llm.delta events">
          <input type="checkbox" checked={hideLlmDelta} onChange={(event) => setHideLlmDelta(event.target.checked)} />
          hide llm.delta
        </label>
        <label style={toggleLabelStyle} title="Hide llm.thinking.delta events">
          <input
            type="checkbox"
            checked={hideThinkingDelta}
            onChange={(event) => setHideThinkingDelta(event.target.checked)}
          />
          hide llm.thinking.delta
        </label>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={exportVisibleToYaml}
          style={controlBtnStyle}
          title="Download currently visible events as YAML"
        >
          ⬇ Export YAML
        </button>
        {exportFeedback === 'ok' && <span style={copyFeedbackOkStyle}>Exported</span>}
        {exportFeedback === 'error' && <span style={copyFeedbackErrorStyle}>Export failed</span>}
        <button type="button" onClick={togglePause} style={controlBtnStyle}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button type="button" onClick={clearLog} style={controlBtnStyle}>
          🗑 Clear
        </button>
        {autoScroll ? (
          <button
            type="button"
            onClick={holdPosition}
            style={controlBtnStyle}
            title="Stop auto-scrolling and hold current position"
          >
            ⏸ Hold
          </button>
        ) : (
          <button
            type="button"
            onClick={followStream}
            style={controlBtnStyle}
            title="Resume live tailing (auto-scroll to newest event)"
          >
            ▶ Follow Stream
          </button>
        )}
        <span style={{ color: '#888', fontSize: '10px' }}>
          {visible.length}/{entries.length}
        </span>
      </div>

      {/* Event log */}
      <div
        ref={logRef}
        data-part="event-viewer-log"
        onScroll={handleLogScroll}
        style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}
      >
        {visible.length === 0 && (
          <div style={{ color: '#999', textAlign: 'center', padding: '24px', fontSize: '13px' }}>
            {entries.length === 0 ? '📡 Waiting for events…' : `All ${entries.length} events are filtered out`}
          </div>
        )}
        {visible.map((entry) => {
          const payloadYaml = toYaml(entry.rawPayload as Record<string, unknown>);
          const copyFeedback = copyFeedbackById[entry.id];
          return (
            <div
              key={entry.id}
              data-part="event-viewer-entry"
              data-family={entry.family}
              style={{ borderBottom: '1px solid #e5e5e5' }}
            >
              <div
                data-part="event-viewer-entry-header"
                onClick={() => toggleExpand(entry.id)}
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  alignItems: 'baseline',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#0000000a';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ color: '#999', fontSize: '10px', minWidth: '70px' }}>
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span
                  style={{
                    color: FAMILY_COLORS[entry.family as Family] ?? '#6b7280',
                    minWidth: '130px',
                    fontWeight: 600,
                  }}
                >
                  {entry.eventType}
                </span>
                {entry.eventId && (
                  <span style={{ color: '#999', fontSize: '10px' }}>
                    {entry.eventId.length > 12 ? entry.eventId.slice(0, 12) + '…' : entry.eventId}
                  </span>
                )}
                <span
                  style={{ color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {entry.summary}
                </span>
                <span style={{ color: '#bbb', fontSize: '10px' }}>{expandedIds.has(entry.id) ? '▼' : '▶'}</span>
              </div>
              {expandedIds.has(entry.id) && (
                <div style={{ margin: '0 8px 4px 86px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 6px' }}>
                    <button type="button" onClick={() => copyPayload(entry.id, payloadYaml)} style={copyBtnStyle}>
                      Copy Payload
                    </button>
                    {copyFeedback === 'copied' && <span style={copyFeedbackOkStyle}>Copied</span>}
                    {copyFeedback === 'error' && <span style={copyFeedbackErrorStyle}>Copy failed</span>}
                  </div>
                  <SyntaxHighlight
                    code={payloadYaml}
                    language="yaml"
                    variant="light"
                    style={{ fontSize: 11, maxHeight: 300, userSelect: 'text' }}
                  />
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

const controlBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: '11px',
  borderRadius: '3px',
  border: '1px solid #ccc',
  background: '#f0f0f0',
  color: '#555',
  cursor: 'pointer',
};

const toggleLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  color: '#6b7280',
  fontSize: '10px',
};

const copyBtnStyle: React.CSSProperties = {
  padding: '1px 7px',
  fontSize: '10px',
  borderRadius: '3px',
  border: '1px solid #ccc',
  background: '#f0f0f0',
  color: '#333',
  cursor: 'pointer',
};

const copyFeedbackOkStyle: React.CSSProperties = {
  color: '#10b981',
  fontSize: '10px',
};

const copyFeedbackErrorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '10px',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(11, 23);
}
