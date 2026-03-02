import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { GraphNavNode, GraphNavEdge } from './types';
import { TYPE_STYLES } from './types';
import {
  SAMPLE_NODES,
  SAMPLE_EDGES,
  NODE_FILTER_TYPES,
} from './sampleData';

// ── Force simulation hook ───────────────────────────────────────────
function useForceGraph(
  nodes: GraphNavNode[],
  edges: GraphNavEdge[],
  width: number,
  height: number,
) {
  const posRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const velRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const frameRef = useRef<number>(0);
  const dragRef = useRef<string | null>(null);

  useEffect(() => {
    if (!width || !height) return;
    const pos: Record<string, { x: number; y: number }> = {};
    const vel: Record<string, { x: number; y: number }> = {};
    const cx = width / 2;
    const cy = height / 2;
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.3;
      pos[n.id] = {
        x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 40,
      };
      vel[n.id] = { x: 0, y: 0 };
    });
    posRef.current = pos;
    velRef.current = vel;
    setPositions({ ...pos });
  }, [nodes, width, height]);

  useEffect(() => {
    if (!posRef.current) return;
    let running = true;
    const step = () => {
      if (!running) return;
      const pos = posRef.current!;
      const vel = velRef.current!;
      const cx = width / 2;
      const cy = height / 2;
      const damping = 0.85;
      const repulsion = 3000;
      const attraction = 0.005;
      const springLen = 120;
      const gravity = 0.02;

      nodes.forEach((a) => {
        if (dragRef.current === a.id) return;
        let fx = 0;
        let fy = 0;
        nodes.forEach((b) => {
          if (a.id === b.id) return;
          const dx = pos[a.id].x - pos[b.id].x;
          const dy = pos[a.id].y - pos[b.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });
        edges.forEach((e) => {
          let other: string | null = null;
          if (e.source === a.id) other = e.target;
          else if (e.target === a.id) other = e.source;
          if (!other || !pos[other]) return;
          const dx = pos[other].x - pos[a.id].x;
          const dy = pos[other].y - pos[a.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - springLen) * attraction;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });
        fx += (cx - pos[a.id].x) * gravity;
        fy += (cy - pos[a.id].y) * gravity;
        vel[a.id].x = (vel[a.id].x + fx) * damping;
        vel[a.id].y = (vel[a.id].y + fy) * damping;
      });

      nodes.forEach((n) => {
        if (dragRef.current === n.id) return;
        pos[n.id].x += vel[n.id].x;
        pos[n.id].y += vel[n.id].y;
        pos[n.id].x = Math.max(30, Math.min(width - 30, pos[n.id].x));
        pos[n.id].y = Math.max(30, Math.min(height - 30, pos[n.id].y));
      });

      setPositions({ ...pos });
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [nodes, edges, width, height]);

  const setDrag = useCallback((id: string | null, x: number, y: number) => {
    dragRef.current = id;
    if (id && posRef.current?.[id]) {
      posRef.current[id].x = x;
      posRef.current[id].y = y;
      if (velRef.current?.[id]) {
        velRef.current[id].x = 0;
        velRef.current[id].y = 0;
      }
    }
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  return { positions, setDrag, endDrag };
}

// ── Graph Canvas ────────────────────────────────────────────────────
function GraphCanvas({
  nodes,
  edges,
  selected,
  onSelect,
  highlighted,
  width,
  height,
}: {
  nodes: GraphNavNode[];
  edges: GraphNavEdge[];
  selected: string | null;
  onSelect: (id: string) => void;
  highlighted: Set<string>;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { positions, setDrag, endDrag } = useForceGraph(
    nodes,
    edges,
    width,
    height,
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e0e0e0';
    for (let x = 0; x < width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(pan.x, pan.y);

    // edges
    edges.forEach((e) => {
      const s = positions[e.source];
      const t = positions[e.target];
      if (!s || !t) return;
      const isHl = highlighted.has(e.source) && highlighted.has(e.target);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = isHl ? '#000' : '#aaa';
      ctx.lineWidth = isHl ? 2 : 1;
      ctx.stroke();

      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      ctx.font = '9px Geneva, monospace';
      ctx.fillStyle = isHl ? '#000' : '#888';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, mx, my - 4);

      const angle = Math.atan2(t.y - s.y, t.x - s.x);
      const dist = Math.sqrt((t.x - s.x) ** 2 + (t.y - s.y) ** 2);
      const arrowDist = dist - 22;
      const ax = s.x + Math.cos(angle) * arrowDist;
      const ay = s.y + Math.sin(angle) * arrowDist;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - 8 * Math.cos(angle - 0.4),
        ay - 8 * Math.sin(angle - 0.4),
      );
      ctx.lineTo(
        ax - 8 * Math.cos(angle + 0.4),
        ay - 8 * Math.sin(angle + 0.4),
      );
      ctx.closePath();
      ctx.fillStyle = isHl ? '#000' : '#aaa';
      ctx.fill();
    });

    // nodes
    nodes.forEach((n) => {
      const p = positions[n.id];
      if (!p) return;
      const s = TYPE_STYLES[n.type] || TYPE_STYLES.Person;
      const isSel = selected === n.id;
      const isHl = highlighted.has(n.id);
      const r = isSel ? 24 : 20;

      ctx.fillStyle = '#000';
      ctx.fillRect(p.x - r + 2, p.y - r + 2, r * 2, r * 2);
      ctx.fillStyle = isSel ? '#000' : isHl ? '#ddd' : s.fill;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2);

      ctx.font = `${isSel ? 18 : 14}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isSel ? '#fff' : '#000';
      ctx.fillText(s.emoji, p.x, p.y);

      ctx.font = 'bold 11px Geneva, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(n.label).width + 6;
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x - tw / 2, p.y + r + 3, tw, 14);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - tw / 2, p.y + r + 3, tw, 14);
      ctx.fillStyle = '#000';
      ctx.fillText(n.label, p.x, p.y + r + 5);
    });

    ctx.restore();
  }, [positions, nodes, edges, selected, highlighted, width, height, pan]);

  const getNodeAt = useCallback(
    (mx: number, my: number) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const p = positions[n.id];
        if (!p) continue;
        if (
          Math.abs(mx - pan.x - p.x) < 22 &&
          Math.abs(my - pan.y - p.y) < 22
        )
          return n.id;
      }
      return null;
    },
    [nodes, positions, pan],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const nid = getNodeAt(mx, my);
      if (nid) {
        setDragging(nid);
        setDrag(nid, mx - pan.x, my - pan.y);
        onSelect(nid);
      } else {
        setIsPanning(true);
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          px: pan.x,
          py: pan.y,
        };
      }
    },
    [getNodeAt, setDrag, onSelect, pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
        return;
      }
      if (!dragging) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      setDrag(dragging, e.clientX - rect.left - pan.x, e.clientY - rect.top - pan.y);
    },
    [dragging, setDrag, isPanning, pan],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
    endDrag();
  }, [endDrag]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        cursor: dragging ? 'grabbing' : 'crosshair',
        display: 'block',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

// ── Props ────────────────────────────────────────────────────────────
export interface GraphNavigatorProps {
  initialNodes?: GraphNavNode[];
  initialEdges?: GraphNavEdge[];
}

// ── Main Component ──────────────────────────────────────────────────
export function GraphNavigator({
  initialNodes = SAMPLE_NODES,
  initialEdges = SAMPLE_EDGES,
}: GraphNavigatorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [queryLog, setQueryLog] = useState([
    'MATCH (n) RETURN n LIMIT 12',
    '// 12 nodes, 19 relationships loaded',
  ]);
  const graphRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });

  useEffect(() => {
    const measure = () => {
      if (graphRef.current) {
        const r = graphRef.current.getBoundingClientRect();
        setDims({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const filteredNodes = useMemo(
    () =>
      filterType === 'All'
        ? initialNodes
        : initialNodes.filter((n) => n.type === filterType),
    [filterType, initialNodes],
  );

  const filteredEdges = useMemo(() => {
    const ids = new Set(filteredNodes.map((n) => n.id));
    return initialEdges.filter(
      (e) => ids.has(e.source) && ids.has(e.target),
    );
  }, [filteredNodes, initialEdges]);

  const selectedNode = useMemo(
    () => initialNodes.find((n) => n.id === selected),
    [selected, initialNodes],
  );

  const connectedEdges = useMemo(() => {
    if (!selected) return [];
    return initialEdges.filter(
      (e) => e.source === selected || e.target === selected,
    );
  }, [selected, initialEdges]);

  const highlighted = useMemo(() => {
    const s = new Set<string>();
    if (selected) {
      s.add(selected);
      connectedEdges.forEach((e) => {
        s.add(e.source);
        s.add(e.target);
      });
    }
    return s;
  }, [selected, connectedEdges]);

  const nodeMap = useMemo(() => {
    const m: Record<string, GraphNavNode> = {};
    initialNodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [initialNodes]);

  const runQuery = () => {
    if (!query.trim()) return;
    const q = query.trim();
    setQueryLog((prev) => [...prev, `> ${q}`]);
    const matchType = q.match(/type\s*=\s*['"](\w+)['"]/i);
    const matchLabel = q.match(/label\s*=\s*['"](\w+)['"]/i);
    if (matchType) {
      setFilterType(matchType[1]);
      setQueryLog((prev) => [
        ...prev,
        `// Filtered to type: ${matchType[1]}`,
      ]);
    } else if (matchLabel) {
      const node = initialNodes.find(
        (n) => n.label.toLowerCase() === matchLabel[1].toLowerCase(),
      );
      if (node) {
        setSelected(node.id);
        setQueryLog((prev) => [...prev, `// Selected: ${node.label}`]);
      } else
        setQueryLog((prev) => [
          ...prev,
          `// No node found with label: ${matchLabel[1]}`,
        ]);
    } else if (
      q.toLowerCase().includes('match') &&
      q.toLowerCase().includes('return')
    ) {
      setFilterType('All');
      setSelected(null);
      setQueryLog((prev) => [
        ...prev,
        `// Showing all ${initialNodes.length} nodes`,
      ]);
    } else {
      setQueryLog((prev) => [
        ...prev,
        '// Unknown query. Try: MATCH (n) RETURN n',
      ]);
    }
    setQuery('');
  };

  const stats = {
    nodes: filteredNodes.length,
    edges: filteredEdges.length,
    types: [...new Set(filteredNodes.map((n) => n.type))].length,
  };

  const edgeTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    initialEdges.forEach((e) => {
      counts[e.label] = (counts[e.label] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [initialEdges]);

  return (
    <div data-part={RICH_PARTS.graphNav}>
      {/* ── Left Sidebar ── */}
      <div data-part={RICH_PARTS.gnSidebar}>
        {/* Node Browser */}
        <div data-part={RICH_PARTS.gnPanel} style={{ flex: 1, minHeight: 0 }}>
          <div data-part={RICH_PARTS.gnPanelHeader}>Node Browser</div>
          <div data-part={RICH_PARTS.gnFilterBar}>
            {NODE_FILTER_TYPES.map((t) => (
              <Btn
                key={t}
                onClick={() => setFilterType(t)}
                data-state={filterType === t ? 'active' : undefined}
                style={{ fontSize: 10, padding: '2px 8px' }}
              >
                {t === 'All'
                  ? '\uD83C\uDF10'
                  : TYPE_STYLES[t]?.emoji}{' '}
                {t}
              </Btn>
            ))}
          </div>
          <div data-part={RICH_PARTS.gnNodeList}>
            {filteredNodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelected(n.id)}
                data-part={RICH_PARTS.gnNodeItem}
                data-state={selected === n.id ? 'selected' : undefined}
              >
                <span style={{ fontSize: 12 }}>
                  {TYPE_STYLES[n.type]?.emoji}
                </span>
                <span style={{ flex: 1, fontSize: 11 }}>{n.label}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>{n.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div data-part={RICH_PARTS.gnPanel} style={{ flexShrink: 0 }}>
          <div data-part={RICH_PARTS.gnPanelHeader}>Statistics</div>
          <div data-part={RICH_PARTS.gnStats}>
            <div>
              Nodes: <b>{stats.nodes}</b>
            </div>
            <div>
              Edges: <b>{stats.edges}</b>
            </div>
            <div>
              Types: <b>{stats.types}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ── Center ── */}
      <div data-part={RICH_PARTS.gnCenter}>
        {/* Graph View */}
        <div data-part={RICH_PARTS.gnPanel} style={{ flex: 1, minHeight: 0 }}>
          <div data-part={RICH_PARTS.gnPanelHeader}>Graph View</div>
          <div ref={graphRef} data-part={RICH_PARTS.gnGraphArea}>
            <GraphCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              selected={selected}
              onSelect={setSelected}
              highlighted={highlighted}
              width={dims.w}
              height={dims.h}
            />
            <div data-part={RICH_PARTS.gnLegend}>
              {Object.entries(TYPE_STYLES).map(([type, s]) => (
                <span key={type}>
                  {s.emoji} {type}
                </span>
              ))}
              <span style={{ opacity: 0.5 }}>| drag nodes {'\u00B7'} pan bg</span>
            </div>
          </div>
        </div>

        {/* Query Console */}
        <div
          data-part={RICH_PARTS.gnPanel}
          style={{ height: 140, flexShrink: 0 }}
        >
          <div data-part={RICH_PARTS.gnPanelHeader}>Query Console</div>
          <div data-part={RICH_PARTS.gnConsole}>
            <div data-part={RICH_PARTS.gnConsoleLog}>
              {queryLog.map((l, i) => (
                <div
                  key={i}
                  style={{
                    color: l.startsWith('//')
                      ? 'var(--hc-color-muted, #666)'
                      : 'inherit',
                  }}
                >
                  {l}
                </div>
              ))}
              <span data-part={RICH_PARTS.gnCursor}>{'\u258C'}</span>
            </div>
            <div data-part={RICH_PARTS.gnConsoleInput}>
              <span data-part={RICH_PARTS.gnPrompt}>{'>'}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runQuery()}
                placeholder="MATCH (n:Person) RETURN n"
                data-part={RICH_PARTS.gnQueryInput}
              />
              <Btn
                onClick={runQuery}
                style={{ borderRadius: 0, fontSize: 11 }}
              >
                Run
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ── */}
      <div data-part={RICH_PARTS.gnInspector}>
        {/* Node Inspector */}
        <div data-part={RICH_PARTS.gnPanel} style={{ flex: 1, minHeight: 0 }}>
          <div data-part={RICH_PARTS.gnPanelHeader}>Node Inspector</div>
          {selectedNode ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div data-part={RICH_PARTS.gnInspectorHeader}>
                <span style={{ fontSize: 22 }}>
                  {TYPE_STYLES[selectedNode.type]?.emoji}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>
                    {selectedNode.label}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>
                    {selectedNode.type} {'\u00B7'} {selectedNode.id}
                  </div>
                </div>
              </div>
              <div data-part={RICH_PARTS.gnPropsSection}>
                <div data-part={RICH_PARTS.gnSectionTitle}>Properties</div>
                {Object.entries(selectedNode.props).map(([k, v]) => (
                  <div key={k} data-part={RICH_PARTS.gnPropRow}>
                    <span style={{ fontWeight: 'bold' }}>{k}:</span>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </div>
              <div data-part={RICH_PARTS.gnPropsSection}>
                <div data-part={RICH_PARTS.gnSectionTitle}>
                  Relationships ({connectedEdges.length})
                </div>
                {connectedEdges.map((e, i) => {
                  const isOut = e.source === selected;
                  const otherId = isOut ? e.target : e.source;
                  const other = nodeMap[otherId];
                  return (
                    <div
                      key={i}
                      onClick={() => setSelected(otherId)}
                      data-part={RICH_PARTS.gnRelItem}
                    >
                      <span>{isOut ? '\u2192' : '\u2190'}</span>
                      <span data-part={RICH_PARTS.gnRelLabel}>
                        {e.label}
                      </span>
                      <span>
                        {TYPE_STYLES[other?.type]?.emoji} {other?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div data-part={RICH_PARTS.gnEmptyInspector}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83D\uDD0E'}</div>
              Click a node in the graph
              <br />
              to inspect its properties
              <br />
              and relationships.
            </div>
          )}
        </div>

        {/* Edge Types */}
        <div
          data-part={RICH_PARTS.gnPanel}
          style={{ height: 140, flexShrink: 0 }}
        >
          <div data-part={RICH_PARTS.gnPanelHeader}>Edge Types</div>
          <div style={{ overflowY: 'auto', padding: 6 }}>
            {edgeTypes.map(([label, count]) => (
              <div key={label} data-part={RICH_PARTS.gnEdgeTypeRow}>
                <span style={{ fontWeight: 'bold' }}>{label}</span>
                <span data-part={RICH_PARTS.gnEdgeCount}>
                  {'\u00D7'}
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
