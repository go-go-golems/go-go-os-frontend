import type { Connection, GraphNode, TempConnection } from './types';
import { getPortPosition } from './nodeEditorGeometry';

export function NodeConnectionSvg({
  nodes,
  connections,
  tempConnection,
}: {
  nodes: GraphNode[];
  connections: Connection[];
  tempConnection: TempConnection | null;
}) {
  const allConnections: (Connection | TempConnection)[] = tempConnection
    ? [...connections, tempConnection]
    : connections;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <marker
          id="dot"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="6"
          markerHeight="6"
        >
          <circle cx="3" cy="3" r="2.5" fill="var(--hc-color-fg, #000)" />
        </marker>
      </defs>
      {allConnections.map((connection, index) => {
        const isTemp = connection === tempConnection;
        const from =
          (connection as TempConnection).fromPos ??
          getPortPosition(nodes, connection.from);
        const to =
          (connection as TempConnection).toPos ??
          getPortPosition(nodes, connection.to!);
        const dx = Math.abs(to.x - from.x) * 0.5;
        const path = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
        return (
          <path
            key={index}
            d={path}
            fill="none"
            stroke="var(--hc-color-fg, #000)"
            strokeWidth={isTemp ? 1.5 : 2}
            strokeDasharray={isTemp ? '4 3' : 'none'}
            markerStart="url(#dot)"
            markerEnd="url(#dot)"
          />
        );
      })}
    </svg>
  );
}
