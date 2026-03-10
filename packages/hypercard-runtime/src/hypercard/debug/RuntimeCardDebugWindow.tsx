import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { type CardStackDefinition } from '@hypercard/engine';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import {
  getPendingRuntimeCards,
  onRegistryChange,
  type RuntimeCardDefinition,
} from '../../plugin-runtime';
import { SyntaxHighlight } from '@hypercard/chat-runtime';
import type { ArtifactRecord } from '../artifacts/artifactsSlice';
import { openCodeEditor } from '../editor/editorLaunch';
import { useRegisteredRuntimeDebugStacks } from './runtimeDebugRegistry';

interface StoreSlice {
  hypercardArtifacts?: { byId: Record<string, ArtifactRecord> };
  pluginCardRuntime?: {
    sessions: Record<string, {
      stackId: string;
      status: string;
      error?: string;
      cardState: Record<string, Record<string, unknown>>;
    }>;
  };
  windowing?: {
    sessions: Record<string, {
      nav?: Array<{
        card?: string;
        param?: string;
      }>;
    }>;
  };
}

export interface RuntimeCardDebugWindowProps {
  ownerAppId: string;
  stacks?: CardStackDefinition[];
  initialStackId?: string;
}

function nextDebugSessionId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}`;
}

function buildStackCardWindowPayload(stack: CardStackDefinition, cardId: string): OpenWindowPayload | null {
  const card = stack.cards[cardId];
  if (!card) {
    return null;
  }

  const sessionId = nextDebugSessionId(`runtime-debug:${stack.id}:${cardId}:`);
  return {
    id: `window:runtime-debug:${stack.id}:${cardId}:${sessionId}`,
    title: card.title ?? cardId,
    icon: card.icon ?? '📄',
    bounds: { x: 180, y: 56, w: 960, h: 700 },
    content: {
      kind: 'card',
      card: {
        stackId: stack.id,
        cardId,
        cardSessionId: sessionId,
      },
    },
  };
}

function cardSource(card: { meta?: Record<string, unknown> }): string | null {
  const runtime = card.meta?.runtime;
  if (!runtime || typeof runtime !== 'object') {
    return null;
  }
  const source = (runtime as Record<string, unknown>).source;
  return typeof source === 'string' && source.trim().length > 0 ? source : null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, borderBottom: '1px solid #999', paddingBottom: 4, marginBottom: 8, color: '#111' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function CodePreview({ code, maxLines = 8 }: { code: string; maxLines?: number }) {
  return <SyntaxHighlight code={code} language="javascript" maxLines={maxLines} />;
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 600,
      padding: '1px 6px',
      borderRadius: 3,
      background: color,
      color: '#fff',
      marginLeft: 6,
    }}>
      {text}
    </span>
  );
}

export function RuntimeCardDebugWindow({
  ownerAppId,
  stacks,
  initialStackId,
}: RuntimeCardDebugWindowProps) {
  const dispatch = useDispatch();
  const [registryCards, setRegistryCards] = useState<RuntimeCardDefinition[]>(getPendingRuntimeCards());
  const registeredStacks = useRegisteredRuntimeDebugStacks();
  const availableStacks = useMemo(
    () => (stacks && stacks.length > 0 ? [...stacks] : registeredStacks),
    [registeredStacks, stacks],
  );
  const [selectedStackId, setSelectedStackId] = useState<string | null>(
    initialStackId ?? availableStacks[0]?.id ?? null,
  );

  useEffect(() => {
    const update = () => setRegistryCards(getPendingRuntimeCards());
    return onRegistryChange(update);
  }, []);

  useEffect(() => {
    const candidateId =
      (selectedStackId && availableStacks.some((stack) => stack.id === selectedStackId))
        ? selectedStackId
        : initialStackId ?? availableStacks[0]?.id ?? null;
    if (candidateId !== selectedStackId) {
      setSelectedStackId(candidateId);
    }
  }, [availableStacks, initialStackId, selectedStackId]);

  const artifacts = useSelector((s: StoreSlice) => s.hypercardArtifacts?.byId ?? {});
  const sessions = useSelector((s: StoreSlice) => s.pluginCardRuntime?.sessions ?? {});
  const windowingSessions = useSelector((s: StoreSlice) => s.windowing?.sessions ?? {});
  const stacksById = useMemo(
    () => new Map(availableStacks.map((stack) => [stack.id, stack])),
    [availableStacks],
  );

  const activeStack = availableStacks.find((stack) => stack.id === selectedStackId) ?? availableStacks[0];
  const stackCards = activeStack ? Object.values(activeStack.cards) : [];
  const runtimeArtifacts = Object.values(artifacts).filter(a => a.runtimeCardId);

  const td: React.CSSProperties = { padding: '3px 8px', fontSize: 11, borderBottom: '1px solid #ccc', verticalAlign: 'top', color: '#111' };
  const th: React.CSSProperties = { ...td, fontWeight: 700, background: '#e8e8f0', position: 'sticky', top: 0, color: '#111' };

  const launchStackCard = (stackId: string, cardId: string) => {
    const stack = stacksById.get(stackId);
    if (!stack) {
      return;
    }
    const payload = buildStackCardWindowPayload(stack, cardId);
    if (!payload) {
      return;
    }
    dispatch(openWindow(payload));
  };

  const sessionCurrentCardIds = useMemo(() => {
    const entries = Object.entries(sessions).map(([sessionId, session]) => {
      const nav = windowingSessions[sessionId]?.nav;
      const navCard =
        Array.isArray(nav) && nav.length > 0 && typeof nav[nav.length - 1]?.card === 'string'
          ? nav[nav.length - 1]?.card ?? null
          : null;
      const fallbackCard = Object.keys(session.cardState ?? {})[0] ?? null;
      return [sessionId, navCard ?? fallbackCard] as const;
    });
    return new Map(entries);
  }, [sessions, windowingSessions]);

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#111', overflow: 'auto', height: '100%' }}>
      <Section title={activeStack ? `📇 Stack: ${activeStack.name} (${activeStack.id})` : '📇 Stack: (none provided)'}>
        {availableStacks.length > 1 && (
          <label style={{ display: 'grid', gap: 4, marginBottom: 8, fontSize: 11 }}>
            <span style={{ color: '#555' }}>Selected stack</span>
            <select
              value={activeStack?.id ?? ''}
              onChange={(event) => setSelectedStackId(event.target.value)}
              style={{ width: 260, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12 }}
            >
              {availableStacks.map((stack) => (
                <option key={stack.id} value={stack.id}>
                  {stack.name} ({stack.id})
                </option>
              ))}
            </select>
          </label>
        )}
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
          homeCard: <code>{activeStack?.homeCard ?? '—'}</code> · {stackCards.length} predefined cards
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Icon</th>
              <th style={th}>ID</th>
              <th style={th}>Title</th>
              <th style={th}>Type</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stackCards.map(c => (
              <tr key={c.id}>
                <td style={td}>{c.icon}</td>
                <td style={td}><code>{c.id}</code></td>
                <td style={td}>{c.title}</td>
                <td style={td}>{c.type}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => launchStackCard(activeStack.id, c.id)}
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 3,
                        border: '1px solid #999',
                        background: '#f0f0f0',
                        cursor: 'pointer',
                      }}
                    >
                      ▶ Open
                    </button>
                    {cardSource(c) ? (
                      <button
                        onClick={() => openCodeEditor(dispatch, { ownerAppId, cardId: c.id }, cardSource(c) ?? '')}
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 3,
                          border: '1px solid #999',
                          background: '#f0f0f0',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title={`🃏 Runtime Card Registry (${registryCards.length})`}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
          Injected runtime cards from artifacts and ad-hoc registration appear here. Built-in stack cards are listed above.
        </div>
        {registryCards.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No runtime cards registered yet.</div>
        ) : (
          registryCards.map(card => (
            <div key={card.cardId} style={{ marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontWeight: 700 }}>{card.cardId}</code>
                <Badge text="registered" color="#2d6a4f" />
                <span style={{ fontSize: 10, color: '#555' }}>
                  {new Date(card.registeredAt).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => openCodeEditor(dispatch, { ownerAppId, cardId: card.cardId }, card.code)}
                  style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 3,
                    border: '1px solid #999', background: '#f0f0f0', cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  ✏️ Edit
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                code: {card.code.length} chars, {card.code.split('\n').length} lines
              </div>
              <CodePreview code={card.code} />
            </div>
          ))
        )}
      </Section>

      <Section title={`🗃 Artifacts with Runtime Cards (${runtimeArtifacts.length})`}>
        {runtimeArtifacts.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No artifacts with runtime card code.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Artifact ID</th>
                <th style={th}>Card ID</th>
                <th style={th}>Title</th>
                <th style={th}>Injection</th>
                <th style={th}>Code</th>
              </tr>
            </thead>
            <tbody>
              {runtimeArtifacts.map(a => (
                <tr key={a.id}>
                  <td style={td}><code>{a.id}</code></td>
                  <td style={td}><code>{a.runtimeCardId}</code></td>
                  <td style={td}>{a.title}</td>
                  <td style={td}>
                    {a.injectionStatus === 'injected' && <Badge text="injected" color="#2d6a4f" />}
                    {a.injectionStatus === 'pending' && <Badge text="pending" color="#e67e22" />}
                    {a.injectionStatus === 'failed' && <Badge text="failed" color="#c0392b" />}
                    {!a.injectionStatus && <Badge text="unknown" color="#666" />}
                    {a.injectionError && <div style={{ fontSize: 10, color: '#c0392b', marginTop: 2 }}>{a.injectionError}</div>}
                  </td>
                  <td style={td}>{a.runtimeCardCode ? `${a.runtimeCardCode.length} chars` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`⚙️ Plugin Sessions (${Object.keys(sessions).length})`}>
        {Object.keys(sessions).length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No active plugin sessions.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Session ID</th>
                <th style={th}>Stack</th>
                <th style={th}>Status</th>
                <th style={th}>Current Card</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sessions).map(([sid, s]) => (
                <tr key={sid}>
                  <td style={td}><code>{sid}</code></td>
                  <td style={td}>{s.stackId}</td>
                  <td style={td}>
                    {s.status === 'ready' && <Badge text="ready" color="#2d6a4f" />}
                    {s.status === 'loading' && <Badge text="loading" color="#e67e22" />}
                    {s.status === 'error' && <Badge text="error" color="#c0392b" />}
                    {s.error && <div style={{ fontSize: 10, color: '#c0392b', marginTop: 2 }}>{s.error}</div>}
                  </td>
                  <td style={td}>
                    {sessionCurrentCardIds.get(sid) ? (
                      <code style={{ fontSize: 10 }}>{sessionCurrentCardIds.get(sid)}</code>
                    ) : (
                      <span style={{ color: '#555' }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    {(() => {
                      const currentCardId = sessionCurrentCardIds.get(sid);
                      if (!currentCardId) {
                        return <span style={{ color: '#555' }}>—</span>;
                      }
                      const stack = stacksById.get(s.stackId);
                      const card = stack?.cards[currentCardId];
                      const source = card ? cardSource(card) : null;
                      return (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => launchStackCard(s.stackId, currentCardId)}
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 3,
                              border: '1px solid #999',
                              background: '#f0f0f0',
                              cursor: 'pointer',
                            }}
                          >
                            ▶ Open
                          </button>
                          {source ? (
                            <button
                              onClick={() => openCodeEditor(dispatch, { ownerAppId, cardId: currentCardId }, source)}
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 3,
                                border: '1px solid #999',
                                background: '#f0f0f0',
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                          ) : null}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
