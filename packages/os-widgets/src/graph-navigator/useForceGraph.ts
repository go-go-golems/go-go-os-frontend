import { useCallback, useEffect, useRef, useState } from 'react';
import type { GraphNavEdge, GraphNavNode } from './types';

export function useForceGraph(
  nodes: GraphNavNode[],
  edges: GraphNavEdge[],
  width: number,
  height: number,
) {
  const posRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const velRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const frameRef = useRef<number>(0);
  const dragRef = useRef<string | null>(null);
  const stepFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!width || !height) return;
    const pos: Record<string, { x: number; y: number }> = {};
    const vel: Record<string, { x: number; y: number }> = {};
    const cx = width / 2;
    const cy = height / 2;
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      pos[node.id] = {
        x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
      };
      vel[node.id] = { x: 0, y: 0 };
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

      nodes.forEach((leftNode) => {
        if (dragRef.current === leftNode.id) return;
        let fx = 0;
        let fy = 0;
        nodes.forEach((rightNode) => {
          if (leftNode.id === rightNode.id) return;
          const dx = pos[leftNode.id].x - pos[rightNode.id].x;
          const dy = pos[leftNode.id].y - pos[rightNode.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });
        edges.forEach((edge) => {
          let other: string | null = null;
          if (edge.source === leftNode.id) other = edge.target;
          else if (edge.target === leftNode.id) other = edge.source;
          if (!other || !pos[other]) return;
          const dx = pos[other].x - pos[leftNode.id].x;
          const dy = pos[other].y - pos[leftNode.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - springLen) * attraction;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });
        fx += (cx - pos[leftNode.id].x) * gravity;
        fy += (cy - pos[leftNode.id].y) * gravity;
        vel[leftNode.id].x = (vel[leftNode.id].x + fx) * damping;
        vel[leftNode.id].y = (vel[leftNode.id].y + fy) * damping;
      });

      let totalEnergy = 0;
      nodes.forEach((node) => {
        if (dragRef.current === node.id) return;
        pos[node.id].x += vel[node.id].x;
        pos[node.id].y += vel[node.id].y;
        pos[node.id].x = Math.max(30, Math.min(width - 30, pos[node.id].x));
        pos[node.id].y = Math.max(30, Math.min(height - 30, pos[node.id].y));
        totalEnergy += Math.abs(vel[node.id].x) + Math.abs(vel[node.id].y);
      });

      setPositions({ ...pos });
      if (totalEnergy > 0.1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = 0;
      }
    };

    stepFnRef.current = step;
    frameRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      stepFnRef.current = null;
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
    if (velRef.current) {
      for (const key of Object.keys(velRef.current)) {
        velRef.current[key].x += (Math.random() - 0.5) * 2;
        velRef.current[key].y += (Math.random() - 0.5) * 2;
      }
    }
    if (!frameRef.current && stepFnRef.current) {
      frameRef.current = requestAnimationFrame(stepFnRef.current);
    }
  }, []);

  return { positions, setDrag, endDrag };
}
