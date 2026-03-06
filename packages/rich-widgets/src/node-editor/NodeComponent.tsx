import { RICH_PARTS as P } from '../parts';
import { NODE_WIDTH, type GraphNode } from './types';

export function NodeComponent({
  node,
  selected,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
}: {
  node: GraphNode;
  selected: boolean;
  onMouseDown: (event: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (
    event: React.MouseEvent,
    portId: string,
    portType: string,
    nodeId: string,
  ) => void;
  onPortMouseUp: (
    event: React.MouseEvent,
    portId: string,
    portType: string,
    nodeId: string,
  ) => void;
}) {
  return (
    <div
      data-part={P.neNode}
      data-state={selected ? 'selected' : undefined}
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).dataset.port) return;
        onMouseDown(event, node.id);
      }}
    >
      <div data-part={P.neNodeHeader}>
        <span>
          {node.icon} {node.title}
        </span>
      </div>

      <div data-part={P.neNodeFields}>
        {node.fields.map((field, index) => (
          <div
            key={index}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20 }}
          >
            <span style={{ fontSize: 10, opacity: 0.6, minWidth: 40 }}>
              {field.label}:
            </span>
            <span
              data-part="field-input"
              style={{ flex: 1, fontSize: 10, padding: '1px 4px' }}
            >
              {field.value}
            </span>
          </div>
        ))}
      </div>

      <div data-part={P.neNodePorts}>
        {node.outputs.map((port, index) => (
          <div
            key={`o-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: 18,
              padding: '2px 6px 2px 8px',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 9, opacity: 0.6 }}>{port.label}</span>
            <div
              data-part={P.nePort}
              data-port={port.id}
              data-port-type="output"
              onMouseDown={(event) => {
                event.stopPropagation();
                onPortMouseDown(event, port.id, 'output', node.id);
              }}
            />
          </div>
        ))}
        {node.inputs.map((port, index) => (
          <div
            key={`i-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 18,
              padding: '2px 8px 2px 6px',
              gap: 4,
            }}
          >
            <div
              data-part={P.nePort}
              data-port={port.id}
              data-port-type="input"
              onMouseDown={(event) => {
                event.stopPropagation();
                onPortMouseDown(event, port.id, 'input', node.id);
              }}
              onMouseUp={(event) => onPortMouseUp(event, port.id, 'input', node.id)}
            />
            <span style={{ fontSize: 9, opacity: 0.6 }}>{port.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
