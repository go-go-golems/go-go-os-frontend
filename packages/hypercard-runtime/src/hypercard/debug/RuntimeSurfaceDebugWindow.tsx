import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { type RuntimeBundleDefinition } from '@hypercard/engine';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import {
  getPendingRuntimeSurfaces,
  onRegistryChange,
  type RuntimeSurfaceDefinition,
} from '../../plugin-runtime';
import { SyntaxHighlight } from '@hypercard/chat-runtime';
import type { ArtifactRecord } from '../artifacts/artifactsSlice';
import { openCodeEditor } from '../editor/editorLaunch';
import { useRegisteredRuntimeDebugStacks } from './runtimeDebugRegistry';

interface StoreSlice {
  hypercardArtifacts?: { byId: Record<string, ArtifactRecord> };
  runtimeSessions?: {
    sessions: Record<string, {
      bundleId: string;
      status: string;
      error?: string;
      surfaceState: Record<string, Record<string, unknown>>;
    }>;
  };
  windowing?: {
    sessions: Record<string, {
      nav?: Array<{
        surface?: string;
        param?: string;
      }>;
    }>;
  };
}

export interface RuntimeSurfaceDebugWindowProps {
  ownerAppId: string;
  bundles?: RuntimeBundleDefinition[];
  initialStackId?: string;
}

function nextDebugSessionId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}`;
}

function buildBundleSurfaceWindowPayload(bundle: RuntimeBundleDefinition, surfaceId: string): OpenWindowPayload | null {
  const surface = bundle.surfaces[surfaceId];
  if (!surface) {
    return null;
  }

  const sessionId = nextDebugSessionId(`runtime-debug:${bundle.id}:${surfaceId}:`);
  return {
    id: `window:runtime-debug:${bundle.id}:${surfaceId}:${sessionId}`,
    title: surface.title ?? surfaceId,
    icon: surface.icon ?? '📄',
    bounds: { x: 180, y: 56, w: 960, h: 700 },
    content: {
      kind: 'surface',
      surface: {
        bundleId: bundle.id,
        surfaceId,
        surfaceSessionId: sessionId,
      },
    },
  };
}

function surfaceSource(surface: { meta?: Record<string, unknown> }): string | null {
  const runtime = surface.meta?.runtime;
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

export function RuntimeSurfaceDebugWindow({
  ownerAppId,
  bundles,
  initialStackId,
}: RuntimeSurfaceDebugWindowProps) {
  const dispatch = useDispatch();
  const [registryCards, setRegistryCards] = useState<RuntimeSurfaceDefinition[]>(getPendingRuntimeSurfaces());
  const registeredStacks = useRegisteredRuntimeDebugStacks();
  const availableBundles = useMemo(
    () => (bundles && bundles.length > 0 ? [...bundles] : registeredStacks),
    [bundles, registeredStacks],
  );
  const [selectedStackId, setSelectedStackId] = useState<string | null>(
    initialStackId ?? availableBundles[0]?.id ?? null,
  );

  useEffect(() => {
    const update = () => setRegistryCards(getPendingRuntimeSurfaces());
    return onRegistryChange(update);
  }, []);

  useEffect(() => {
    const candidateId =
      (selectedStackId && availableBundles.some((bundle) => bundle.id === selectedStackId))
        ? selectedStackId
        : initialStackId ?? availableBundles[0]?.id ?? null;
    if (candidateId !== selectedStackId) {
      setSelectedStackId(candidateId);
    }
  }, [availableBundles, initialStackId, selectedStackId]);

  const artifacts = useSelector((s: StoreSlice) => s.hypercardArtifacts?.byId ?? {});
  const sessions = useSelector((s: StoreSlice) => s.runtimeSessions?.sessions ?? {});
  const windowingSessions = useSelector((s: StoreSlice) => s.windowing?.sessions ?? {});
  const bundlesById = useMemo(
    () => new Map(availableBundles.map((bundle) => [bundle.id, bundle])),
    [availableBundles],
  );

  const activeBundle = availableBundles.find((bundle) => bundle.id === selectedStackId) ?? availableBundles[0];
  const bundleSurfaces = activeBundle ? Object.values(activeBundle.surfaces) : [];
  const runtimeArtifacts = Object.values(artifacts).filter((artifact) => artifact.runtimeSurfaceId);

  const td: React.CSSProperties = { padding: '3px 8px', fontSize: 11, borderBottom: '1px solid #ccc', verticalAlign: 'top', color: '#111' };
  const th: React.CSSProperties = { ...td, fontWeight: 700, background: '#e8e8f0', position: 'sticky', top: 0, color: '#111' };

  const launchBundleSurface = (bundleId: string, surfaceId: string) => {
    const bundle = bundlesById.get(bundleId);
    if (!bundle) {
      return;
    }
    const payload = buildBundleSurfaceWindowPayload(bundle, surfaceId);
    if (!payload) {
      return;
    }
    dispatch(openWindow(payload));
  };

  const sessionCurrentSurfaceIds = useMemo(() => {
    const entries = Object.entries(sessions).map(([sessionId, session]) => {
      const nav = windowingSessions[sessionId]?.nav;
      const navSurface =
        Array.isArray(nav) && nav.length > 0 && typeof nav[nav.length - 1]?.surface === 'string'
          ? nav[nav.length - 1]?.surface ?? null
          : null;
      const fallbackSurface = Object.keys(session.surfaceState ?? {})[0] ?? null;
      return [sessionId, navSurface ?? fallbackSurface] as const;
    });
    return new Map(entries);
  }, [sessions, windowingSessions]);

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#111', overflow: 'auto', height: '100%' }}>
      <Section title={activeBundle ? `📦 Bundle: ${activeBundle.name} (${activeBundle.id})` : '📦 Bundle: (none provided)'}>
        {availableBundles.length > 1 && (
          <label style={{ display: 'grid', gap: 4, marginBottom: 8, fontSize: 11 }}>
            <span style={{ color: '#555' }}>Selected bundle</span>
            <select
              value={activeBundle?.id ?? ''}
              onChange={(event) => setSelectedStackId(event.target.value)}
              style={{ width: 260, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12 }}
            >
              {availableBundles.map((bundle) => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.name} ({bundle.id})
                </option>
              ))}
            </select>
          </label>
        )}
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
          homeSurface: <code>{activeBundle?.homeSurface ?? '—'}</code> · {bundleSurfaces.length} predefined surfaces
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
            {bundleSurfaces.map(c => (
              <tr key={c.id}>
                <td style={td}>{c.icon}</td>
                <td style={td}><code>{c.id}</code></td>
                <td style={td}>{c.title}</td>
                <td style={td}>{c.type}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => activeBundle && launchBundleSurface(activeBundle.id, c.id)}
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
                    {surfaceSource(c) ? (
                      <button
                        onClick={() => openCodeEditor(dispatch, { ownerAppId, surfaceId: c.id }, surfaceSource(c) ?? '')}
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

      <Section title={`🃏 Runtime Surface Registry (${registryCards.length})`}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
          Injected runtime surfaces from artifacts and ad-hoc registration appear here. Built-in bundle surfaces are listed above.
        </div>
        {registryCards.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No runtime surfaces registered yet.</div>
        ) : (
          registryCards.map((surface) => (
            <div key={surface.surfaceId} style={{ marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontWeight: 700 }}>{surface.surfaceId}</code>
                <Badge text="registered" color="#2d6a4f" />
                <span style={{ fontSize: 10, color: '#555' }}>
                  {new Date(surface.registeredAt).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => openCodeEditor(dispatch, { ownerAppId, surfaceId: surface.surfaceId }, surface.code)}
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
                code: {surface.code.length} chars, {surface.code.split('\n').length} lines
              </div>
              <CodePreview code={surface.code} />
            </div>
          ))
        )}
      </Section>

      <Section title={`🗃 Artifacts with Runtime Surfaces (${runtimeArtifacts.length})`}>
        {runtimeArtifacts.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555' }}>No artifacts with runtime surface code.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Artifact ID</th>
                <th style={th}>Surface ID</th>
                <th style={th}>Title</th>
                <th style={th}>Injection</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {runtimeArtifacts.map(a => (
                <tr key={a.id}>
                  <td style={td}><code>{a.id}</code></td>
                  <td style={td}><code>{a.runtimeSurfaceId}</code></td>
                  <td style={td}>{a.title}</td>
                  <td style={td}>
                    {a.injectionStatus === 'injected' && <Badge text="injected" color="#2d6a4f" />}
                    {a.injectionStatus === 'pending' && <Badge text="pending" color="#e67e22" />}
                    {a.injectionStatus === 'failed' && <Badge text="failed" color="#c0392b" />}
                    {!a.injectionStatus && <Badge text="unknown" color="#666" />}
                    {a.injectionError && <div style={{ fontSize: 10, color: '#c0392b', marginTop: 2 }}>{a.injectionError}</div>}
                  </td>
                  <td style={td}>{a.runtimeSurfaceCode ? `${a.runtimeSurfaceCode.length} chars` : '—'}</td>
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
                <th style={th}>Bundle</th>
                <th style={th}>Status</th>
                <th style={th}>Current Surface</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sessions).map(([sid, s]) => (
                <tr key={sid}>
                  <td style={td}><code>{sid}</code></td>
                  <td style={td}>{s.bundleId}</td>
                  <td style={td}>
                    {s.status === 'ready' && <Badge text="ready" color="#2d6a4f" />}
                    {s.status === 'loading' && <Badge text="loading" color="#e67e22" />}
                    {s.status === 'error' && <Badge text="error" color="#c0392b" />}
                    {s.error && <div style={{ fontSize: 10, color: '#c0392b', marginTop: 2 }}>{s.error}</div>}
                  </td>
                  <td style={td}>
                    {sessionCurrentSurfaceIds.get(sid) ? (
                      <code style={{ fontSize: 10 }}>{sessionCurrentSurfaceIds.get(sid)}</code>
                    ) : (
                      <span style={{ color: '#555' }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    {(() => {
                      const currentSurfaceId = sessionCurrentSurfaceIds.get(sid);
                      if (!currentSurfaceId) {
                        return <span style={{ color: '#555' }}>—</span>;
                      }
                      const bundle = bundlesById.get(s.bundleId);
                      const surface = bundle?.surfaces[currentSurfaceId];
                      const source = surface ? surfaceSource(surface) : null;
                      return (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => launchBundleSurface(s.bundleId, currentSurfaceId)}
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
                              onClick={() => openCodeEditor(dispatch, { ownerAppId, surfaceId: currentSurfaceId }, source)}
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
