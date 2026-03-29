import type { BlockInstance, Point, Wire } from './types';
import { getPortPos } from './systemModelerGeometry';

function SvgPort({
  pos,
  isInput,
  blockId,
  portIdx,
  onMouseDown,
  onMouseUp,
}: {
  pos: Point;
  isInput: boolean;
  blockId: string;
  portIdx: number;
  onMouseDown: (event: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
  onMouseUp: (event: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
}) {
  return (
    <g
      onMouseDown={(event) => onMouseDown(event, blockId, isInput, portIdx)}
      onMouseUp={(event) => onMouseUp(event, blockId, isInput, portIdx)}
      style={{ cursor: 'crosshair' }}
    >
      <circle cx={pos.x} cy={pos.y} r={6} fill="#fff" stroke="#000" strokeWidth={2} />
      <text
        x={pos.x}
        y={pos.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={7}
        fill="#000"
        pointerEvents="none"
        fontFamily="monospace"
      >
        ▸
      </text>
    </g>
  );
}

export function SvgBlock({
  block,
  isSelected,
  onBlockMouseDown,
  onBlockDoubleClick,
  onPortMouseDown,
  onPortMouseUp,
}: {
  block: BlockInstance;
  isSelected: boolean;
  onBlockMouseDown: (event: React.MouseEvent, blockId: string) => void;
  onBlockDoubleClick: (blockId: string) => void;
  onPortMouseDown: (event: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
  onPortMouseUp: (event: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
}) {
  return (
    <g
      onMouseDown={(event) => onBlockMouseDown(event, block.id)}
      onDoubleClick={() => onBlockDoubleClick(block.id)}
      style={{ cursor: 'grab' }}
    >
      <rect x={block.x + 2} y={block.y + 2} width={block.w} height={block.h} fill="#000" />
      <rect
        x={block.x}
        y={block.y}
        width={block.w}
        height={block.h}
        fill="#fff"
        stroke="#000"
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={isSelected ? '4 2' : 'none'}
      />
      <rect x={block.x} y={block.y} width={block.w} height={16} fill="#000" />
      <text
        x={block.x + block.w / 2}
        y={block.y + 11}
        textAnchor="middle"
        fontFamily="monospace"
        fontSize={9}
        fill="#fff"
        pointerEvents="none"
      >
        {block.label}
      </text>
      <text
        x={block.x + block.w / 2}
        y={block.y + 16 + (block.h - 16) / 2 + 5}
        textAnchor="middle"
        fontSize={20}
        pointerEvents="none"
      >
        {block.emoji}
      </text>
      {Array.from({ length: block.inputs }, (_, index) => (
        <SvgPort
          key={`${block.id}-i-${index}`}
          pos={getPortPos(block, true, index)}
          isInput
          blockId={block.id}
          portIdx={index}
          onMouseDown={onPortMouseDown}
          onMouseUp={onPortMouseUp}
        />
      ))}
      {Array.from({ length: block.outputs }, (_, index) => (
        <SvgPort
          key={`${block.id}-o-${index}`}
          pos={getPortPos(block, false, index)}
          isInput={false}
          blockId={block.id}
          portIdx={index}
          onMouseDown={onPortMouseDown}
          onMouseUp={onPortMouseUp}
        />
      ))}
    </g>
  );
}

export function SvgWire({
  wire,
  blocks,
  onDelete,
}: {
  wire: Wire;
  blocks: BlockInstance[];
  onDelete: (wireId: string) => void;
}) {
  const fromBlock = blocks.find((block) => block.id === wire.from);
  const toBlock = blocks.find((block) => block.id === wire.to);
  if (!fromBlock || !toBlock) return null;
  const start = getPortPos(fromBlock, false, wire.fromPort);
  const end = getPortPos(toBlock, true, wire.toPort);
  const midX = (start.x + end.x) / 2;
  return (
    <path
      d={`M${start.x},${start.y} C${midX},${start.y} ${midX},${end.y} ${end.x},${end.y}`}
      fill="none"
      stroke="#000"
      strokeWidth={2}
      onClick={(event) => {
        event.stopPropagation();
        onDelete(wire.id);
      }}
      style={{ cursor: 'pointer' }}
    />
  );
}
