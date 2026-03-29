import { useCallback, useEffect, useRef, useState } from 'react';
import { TYPE_STYLES, type GraphNavEdge, type GraphNavNode } from './types';
import { useForceGraph } from './useForceGraph';

export function GraphCanvas({
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
  const { positions, setDrag, endDrag } = useForceGraph(nodes, edges, width, height);
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

    edges.forEach((edge) => {
      const source = positions[edge.source];
      const target = positions[edge.target];
      if (!source || !target) return;
      const isHighlighted = highlighted.has(edge.source) && highlighted.has(edge.target);
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isHighlighted ? '#000' : '#aaa';
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();

      const mx = (source.x + target.x) / 2;
      const my = (source.y + target.y) / 2;
      ctx.font = '9px Geneva, monospace';
      ctx.fillStyle = isHighlighted ? '#000' : '#888';
      ctx.textAlign = 'center';
      ctx.fillText(edge.label, mx, my - 4);

      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const dist = Math.sqrt((target.x - source.x) ** 2 + (target.y - source.y) ** 2);
      const arrowDist = dist - 22;
      const ax = source.x + Math.cos(angle) * arrowDist;
      const ay = source.y + Math.sin(angle) * arrowDist;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = isHighlighted ? '#000' : '#aaa';
      ctx.fill();
    });

    nodes.forEach((node) => {
      const position = positions[node.id];
      if (!position) return;
      const style = TYPE_STYLES[node.type] || TYPE_STYLES.Person;
      const isSelected = selected === node.id;
      const isHighlighted = highlighted.has(node.id);
      const radius = isSelected ? 24 : 20;

      ctx.fillStyle = '#000';
      ctx.fillRect(position.x - radius + 2, position.y - radius + 2, radius * 2, radius * 2);
      ctx.fillStyle = isSelected ? '#000' : isHighlighted ? '#ddd' : style.fill;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillRect(position.x - radius, position.y - radius, radius * 2, radius * 2);
      ctx.strokeRect(position.x - radius, position.y - radius, radius * 2, radius * 2);

      ctx.font = `${isSelected ? 18 : 14}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isSelected ? '#fff' : '#000';
      ctx.fillText(style.emoji, position.x, position.y);

      ctx.font = 'bold 11px Geneva, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const textWidth = ctx.measureText(node.label).width + 6;
      ctx.fillStyle = '#fff';
      ctx.fillRect(position.x - textWidth / 2, position.y + radius + 3, textWidth, 14);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(position.x - textWidth / 2, position.y + radius + 3, textWidth, 14);
      ctx.fillStyle = '#000';
      ctx.fillText(node.label, position.x, position.y + radius + 5);
    });

    ctx.restore();
  }, [positions, nodes, edges, selected, highlighted, width, height, pan]);

  const getNodeAt = useCallback(
    (mx: number, my: number) => {
      for (let index = nodes.length - 1; index >= 0; index -= 1) {
        const node = nodes[index];
        const position = positions[node.id];
        if (!position) continue;
        if (Math.abs(mx - pan.x - position.x) < 22 && Math.abs(my - pan.y - position.y) < 22) {
          return node.id;
        }
      }
      return null;
    },
    [nodes, positions, pan],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const nodeId = getNodeAt(mx, my);
      if (nodeId) {
        setDragging(nodeId);
        setDrag(nodeId, mx - pan.x, my - pan.y);
        onSelect(nodeId);
      } else {
        setIsPanning(true);
        panStart.current = {
          x: event.clientX,
          y: event.clientY,
          px: pan.x,
          py: pan.y,
        };
      }
    },
    [getNodeAt, onSelect, pan, setDrag],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        const dx = event.clientX - panStart.current.x;
        const dy = event.clientY - panStart.current.y;
        setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
        return;
      }
      if (!dragging) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      setDrag(dragging, event.clientX - rect.left - pan.x, event.clientY - rect.top - pan.y);
    },
    [dragging, isPanning, pan, setDrag],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
    endDrag();
  }, [endDrag]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: dragging ? 'grabbing' : 'crosshair', display: 'block' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
