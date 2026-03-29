import { useMemo, useState } from 'react';
import {
  invokeTaskManagerAction,
  useRegisteredTaskManagerSources,
  useTaskManagerRows,
} from './taskManagerRegistry';

function normalize(text: string | undefined): string {
  return typeof text === 'string' ? text.trim().toLowerCase() : '';
}

function matchesText(value: string | undefined, query: string): boolean {
  if (!query) {
    return true;
  }
  return normalize(value).includes(query);
}

function detailSummary(details: Record<string, string> | undefined): string {
  if (!details) {
    return '—';
  }
  const entries = Object.entries(details).filter(([, value]) => value && value !== '—');
  if (entries.length === 0) {
    return '—';
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(' · ');
}

export function TaskManagerWindow() {
  const sources = useRegisteredTaskManagerSources();
  const rows = useTaskManagerRows();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedQuery = normalize(query);
  const availableKinds = useMemo(
    () => Array.from(new Set(rows.map((row) => row.kind))).sort(),
    [rows],
  );
  const availableStatuses = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status))).sort(),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (kindFilter !== 'all' && row.kind !== kindFilter) {
          return false;
        }
        if (statusFilter !== 'all' && row.status !== statusFilter) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return (
          matchesText(row.title, normalizedQuery) ||
          matchesText(row.kind, normalizedQuery) ||
          matchesText(row.status, normalizedQuery) ||
          matchesText(row.sourceTitle, normalizedQuery) ||
          Object.values(row.details ?? {}).some((value) => matchesText(value, normalizedQuery))
        );
      }),
    [rows, kindFilter, statusFilter, normalizedQuery],
  );

  const summary = useMemo(() => {
    const byKind = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.kind] = (acc[row.kind] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(byKind)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([kind, count]) => `${kind}: ${count}`)
      .join(' · ');
  }, [rows]);

  const td: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 11,
    borderBottom: '1px solid #ccc',
    verticalAlign: 'top',
    color: '#111',
  };
  const th: React.CSSProperties = {
    ...td,
    fontWeight: 700,
    background: '#e8e8f0',
    position: 'sticky',
    top: 0,
  };

  async function handleAction(sourceId: string, rowId: string, actionId: string) {
    const token = `${sourceId}:${rowId}:${actionId}`;
    setBusyAction(token);
    setError(null);
    try {
      await invokeTaskManagerAction(sourceId, rowId, actionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusyAction((current) => (current === token ? null : current));
    }
  }

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#111', overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Task Manager</div>
            <div style={{ fontSize: 11, color: '#555' }}>
              {sources.length} sources · {rows.length} rows{summary ? ` · ${summary}` : ''}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#555' }}>
            Operator view for runtime sessions and broker-owned JS sessions
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#555' }}>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, source, details..."
              style={{ width: 260, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12 }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#555' }}>Kind</span>
            <select
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value)}
              style={{ minWidth: 150, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12 }}
            >
              <option value="all">All kinds</option>
              {availableKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#555' }}>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ minWidth: 140, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12 }}
            >
              <option value="all">All statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div style={{ padding: '6px 8px', border: '1px solid #c88', background: '#fff2f2', color: '#822' }}>
            {error}
          </div>
        ) : null}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Source</th>
            <th style={th}>Kind</th>
            <th style={th}>Title</th>
            <th style={th}>Status</th>
            <th style={th}>Started</th>
            <th style={th}>Details</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row) => (
            <tr key={`${row.sourceId}:${row.id}`}>
              <td style={td}>{row.sourceTitle}</td>
              <td style={td}><code>{row.kind}</code></td>
              <td style={td}>
                <div>{row.title}</div>
                <div style={{ fontSize: 10, color: '#666' }}><code>{row.id}</code></div>
              </td>
              <td style={td}>{row.status}</td>
              <td style={td}>{row.startedAt ?? '—'}</td>
              <td style={td}>{detailSummary(row.details)}</td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {row.actions.map((action) => {
                    const token = `${row.sourceId}:${row.id}:${action.id}`;
                    const busy = busyAction === token;
                    return (
                      <button
                        key={action.id}
                        onClick={() => void handleAction(row.sourceId, row.id, action.id)}
                        disabled={busy}
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 3,
                          border: '1px solid #999',
                          background: busy ? '#ddd' : '#f0f0f0',
                          cursor: busy ? 'progress' : 'pointer',
                        }}
                      >
                        {busy ? '…' : action.label}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
          {filteredRows.length === 0 ? (
            <tr>
              <td style={td} colSpan={7}>
                {rows.length === 0
                  ? 'No task-manager sources are registered yet.'
                  : 'No rows match the current search and filter settings.'}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
