/**
 * Timeline debug window — read-only inspection and export of conversation
 * timeline state.  Shows entity list + structured tree + copy/export actions.
 */

import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { ChatStateSlice } from '../state/selectors';
import { selectConversationTimelineState } from '../state/selectors';
import { copyTextToClipboard } from './clipboard';
import { StructuredDataTree } from './StructuredDataTree';
import { SyntaxHighlight } from './SyntaxHighlight';
import {
  buildConversationYamlForCopy,
  buildEntityYamlForCopy,
  buildTimelineDebugSnapshot,
  buildTimelineYamlExport,
  type TimelineDebugEntitySnapshot,
  type TimelineDebugSnapshot,
} from './timelineDebugModel';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TimelineDebugWindowProps {
  conversationId: string;
  /** Optional pre-built snapshot for storybook/testing (bypasses Redux) */
  initialSnapshot?: TimelineDebugSnapshot;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineDebugWindow({ conversationId, initialSnapshot }: TimelineDebugWindowProps) {
  const convState = useSelector((state: ChatStateSlice) => selectConversationTimelineState(state, conversationId));

  const snapshot = useMemo(() => {
    if (initialSnapshot) return initialSnapshot;
    return buildTimelineDebugSnapshot(conversationId, convState);
  }, [conversationId, convState, initialSnapshot]);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'yaml'>('tree');
  const [copyConvFeedback, setCopyConvFeedback] = useState<'ok' | 'error' | null>(null);
  const [exportFeedback, setExportFeedback] = useState<'ok' | 'error' | null>(null);
  const [entityCopyFeedback, setEntityCopyFeedback] = useState<Record<string, 'ok' | 'error'>>({});

  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return snapshot.timeline.entities.find((e) => e.id === selectedEntityId) ?? null;
  }, [selectedEntityId, snapshot]);

  // --- actions ---

  const copyConversation = useCallback(() => {
    const yaml = buildConversationYamlForCopy(snapshot);
    copyTextToClipboard(yaml)
      .then(() => setCopyConvFeedback('ok'))
      .catch(() => setCopyConvFeedback('error'))
      .finally(() => {
        setTimeout(() => setCopyConvFeedback(null), 1400);
      });
  }, [snapshot]);

  const exportYaml = useCallback(() => {
    try {
      const { fileName, yaml } = buildTimelineYamlExport(snapshot);
      const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportFeedback('ok');
    } catch {
      setExportFeedback('error');
    } finally {
      setTimeout(() => setExportFeedback(null), 1400);
    }
  }, [snapshot]);

  const copyEntity = useCallback(
    (entity: TimelineDebugEntitySnapshot) => {
      const yaml = buildEntityYamlForCopy(entity, conversationId);
      copyTextToClipboard(yaml)
        .then(() => setEntityCopyFeedback((p) => ({ ...p, [entity.id]: 'ok' })))
        .catch(() => setEntityCopyFeedback((p) => ({ ...p, [entity.id]: 'error' })))
        .finally(() => {
          setTimeout(() => {
            setEntityCopyFeedback((p) => {
              const next = { ...p };
              delete next[entity.id];
              return next;
            });
          }, 1400);
        });
    },
    [conversationId],
  );

  // --- render ---

  return (
    <div data-part="timeline-debug" style={rootStyle}>
      {/* Toolbar */}
      <div data-part="timeline-debug-toolbar" style={toolbarStyle}>
        <button type="button" onClick={copyConversation} style={controlBtnStyle}>
          📋 Copy Conversation
        </button>
        {copyConvFeedback === 'ok' && <span style={feedbackOkStyle}>Copied</span>}
        {copyConvFeedback === 'error' && <span style={feedbackErrorStyle}>Copy failed</span>}
        <button type="button" onClick={exportYaml} style={controlBtnStyle}>
          ⬇ Export YAML
        </button>
        {exportFeedback === 'ok' && <span style={feedbackOkStyle}>Exported</span>}
        {exportFeedback === 'error' && <span style={feedbackErrorStyle}>Export failed</span>}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setViewMode((m) => (m === 'tree' ? 'yaml' : 'tree'))}
          style={controlBtnStyle}
        >
          {viewMode === 'tree' ? '📄 YAML' : '🌳 Tree'}
        </button>
        <span style={summaryStyle}>
          {snapshot.summary.entityCount} entities
          {' · '}
          {Object.entries(snapshot.summary.kinds)
            .map(([k, n]) => `${k}: ${n}`)
            .join(', ')}
        </span>
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {/* Entity list (left) */}
        <div data-part="timeline-debug-list" style={listPaneStyle}>
          {snapshot.timeline.entities.length === 0 && (
            <div style={{ color: '#999', textAlign: 'center', padding: 24, fontSize: 12 }}>Empty timeline</div>
          )}
          {snapshot.timeline.entities.map((entity) => (
            <EntityRow
              key={entity.id}
              entity={entity}
              selected={entity.id === selectedEntityId}
              copyFeedback={entityCopyFeedback[entity.id] ?? null}
              onSelect={() => setSelectedEntityId(entity.id === selectedEntityId ? null : entity.id)}
              onCopy={() => copyEntity(entity)}
            />
          ))}
        </div>

        {/* Detail pane (right) */}
        <div data-part="timeline-debug-detail" style={detailPaneStyle}>
          {selectedEntity ? (
            <EntityDetail entity={selectedEntity} viewMode={viewMode} conversationId={conversationId} />
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: 24, fontSize: 12 }}>
              Select an entity to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entity row
// ---------------------------------------------------------------------------

function EntityRow({
  entity,
  selected,
  copyFeedback,
  onSelect,
  onCopy,
}: {
  entity: TimelineDebugEntitySnapshot;
  selected: boolean;
  copyFeedback: 'ok' | 'error' | null;
  onSelect: () => void;
  onCopy: () => void;
}) {
  return (
    <div
      data-part="timeline-debug-entity-row"
      data-state={selected ? 'selected' : undefined}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        cursor: 'pointer',
        borderBottom: '1px solid #e5e5e5',
        background: selected ? '#0000000a' : 'transparent',
      }}
      onMouseOver={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = '#00000006';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.background = selected ? '#0000000a' : 'transparent';
      }}
    >
      <span style={{ color: '#999', fontSize: 10, minWidth: 24, textAlign: 'right' }}>{entity.orderIndex}</span>
      <span style={{ color: kindColor(entity.kind), fontWeight: 600, minWidth: 100, fontSize: 11 }}>{entity.kind}</span>
      <span
        style={{
          color: '#666',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 10,
        }}
      >
        {entity.id}
      </span>
      <span style={{ color: '#999', fontSize: 9, minWidth: 70 }}>{formatTimestamp(entity.createdAt)}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
        style={copyBtnStyle}
      >
        {copyFeedback === 'ok' ? '✅' : copyFeedback === 'error' ? '⚠' : '📋'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entity detail pane
// ---------------------------------------------------------------------------

function EntityDetail({
  entity,
  viewMode,
  conversationId,
}: {
  entity: TimelineDebugEntitySnapshot;
  viewMode: 'tree' | 'yaml';
  conversationId: string;
}) {
  if (viewMode === 'yaml') {
    const yaml = buildEntityYamlForCopy(entity, conversationId);
    return (
      <div style={{ padding: '4px 8px', overflow: 'auto', height: '100%' }}>
        <SyntaxHighlight
          code={yaml}
          language="yaml"
          variant="light"
          style={{ fontSize: 11, maxHeight: 'none', userSelect: 'text' }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 8px', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11 }}>
        <span>
          <b style={{ color: '#7c3aed' }}>id:</b> <span style={{ color: '#0550ae' }}>{entity.id}</span>
        </span>
        <span>
          <b style={{ color: '#7c3aed' }}>kind:</b> <span style={{ color: kindColor(entity.kind) }}>{entity.kind}</span>
        </span>
        <span>
          <b style={{ color: '#7c3aed' }}>index:</b> <span style={{ color: '#0969da' }}>{entity.orderIndex}</span>
        </span>
        {entity.version !== null && (
          <span>
            <b style={{ color: '#7c3aed' }}>v:</b> <span style={{ color: '#0969da' }}>{entity.version}</span>
          </span>
        )}
      </div>
      <StructuredDataTree data={entity.props} label="props" defaultCollapsed={false} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toISOString().slice(11, 23);
}

const KIND_COLORS: Record<string, string> = {
  message: '#3b82f6',
  assistant_message: '#3b82f6',
  user_message: '#10b981',
  tool_call: '#f59e0b',
  tool_result: '#f59e0b',
  'hypercard.card.v2': '#8b5cf6',
  suggestions: '#6366f1',
};

function kindColor(kind: string): string {
  return KIND_COLORS[kind] ?? '#6b7280';
}

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  fontFamily: 'monospace',
  fontSize: 12,
  color: '#333',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '4px 8px',
  borderBottom: '1px solid #ddd',
  background: '#f8f9fa',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
};

const listPaneStyle: React.CSSProperties = {
  width: '40%',
  minWidth: 200,
  maxWidth: 400,
  overflow: 'auto',
  borderRight: '1px solid #ddd',
};

const detailPaneStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

const controlBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  borderRadius: 3,
  border: '1px solid #ccc',
  background: '#f0f0f0',
  color: '#555',
  cursor: 'pointer',
};

const copyBtnStyle: React.CSSProperties = {
  padding: '1px 5px',
  fontSize: 10,
  borderRadius: 3,
  border: '1px solid #ccc',
  background: '#f0f0f0',
  color: '#333',
  cursor: 'pointer',
  lineHeight: 1,
};

const feedbackOkStyle: React.CSSProperties = { color: '#16a34a', fontSize: 10 };
const feedbackErrorStyle: React.CSSProperties = { color: '#dc2626', fontSize: 10 };
const summaryStyle: React.CSSProperties = { color: '#888', fontSize: 10 };
