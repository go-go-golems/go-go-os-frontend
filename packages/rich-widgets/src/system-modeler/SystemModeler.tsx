import { useState, useRef, useCallback, useEffect } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { BlockInstance, Wire, DragState, WiringState, BlockTypeDef, Point } from './types';
import { BLOCK_TYPES, SOURCE_BLOCKS, MATH_BLOCKS, ROUTING_BLOCKS } from './types';
import { INITIAL_BLOCKS, INITIAL_WIRES } from './sampleData';

// ── Props ────────────────────────────────────────────────────────────
export interface SystemModelerProps {
  /** Starting blocks on the canvas. */
  initialBlocks?: BlockInstance[];
  /** Starting wires. */
  initialWires?: Wire[];
}

// ── Helpers ──────────────────────────────────────────────────────────

// idCounter moved to useRef inside SystemModeler component

function getPortPos(block: BlockInstance, isInput: boolean, portIdx: number): Point {
  const portCount = isInput ? block.inputs : block.outputs;
  const spacing = block.h / (portCount + 1);
  return {
    x: block.x + (isInput ? 0 : block.w),
    y: block.y + spacing * (portIdx + 1),
  };
}

// ── Sub-components ───────────────────────────────────────────────────

function PaletteSection({
  title,
  blocks,
  onAdd,
}: {
  title: string;
  blocks: BlockTypeDef[];
  onAdd: (bt: BlockTypeDef) => void;
}) {
  return (
    <>
      <div data-part={RICH_PARTS.smPaletteSectionTitle}>{title}</div>
      {blocks.map((bt) => (
        <div
          key={bt.type}
          data-part={RICH_PARTS.smPaletteItem}
          onClick={() => onAdd(bt)}
        >
          <span data-part={RICH_PARTS.smPaletteItemIcon}>{bt.emoji}</span>
          {bt.label}
        </div>
      ))}
    </>
  );
}

function ParamsDialog({
  block,
  onClose,
}: {
  block: BlockInstance;
  onClose: () => void;
}) {
  return (
    <div data-part={RICH_PARTS.smDialogOverlay} onClick={onClose}>
      <div data-part={RICH_PARTS.smDialog} onClick={(e) => e.stopPropagation()}>
        <div data-part={RICH_PARTS.smDialogHeader}>
          {block.emoji} {block.label} Parameters
        </div>
        <div data-part={RICH_PARTS.smDialogBody}>
          <div data-part={RICH_PARTS.smParamInfo}>
            <div>Block: <b>{block.label}</b></div>
            <div>Type: {block.type}</div>
            <div>Ports: {block.inputs} in / {block.outputs} out</div>
          </div>
          {block.type === 'gain' && (
            <div data-part={RICH_PARTS.smParamRow}>
              <span>Gain:</span>
              <input data-part="field-input" defaultValue="1.0" style={{ width: 80 }} />
            </div>
          )}
          {block.type === 'source' && (
            <>
              <div data-part={RICH_PARTS.smParamRow}>
                <span>Amplitude:</span>
                <input data-part="field-input" defaultValue="1.0" style={{ width: 60 }} />
              </div>
              <div data-part={RICH_PARTS.smParamRow}>
                <span>Frequency:</span>
                <input data-part="field-input" defaultValue="1.0" style={{ width: 60 }} />
                <span>rad/s</span>
              </div>
            </>
          )}
          {block.type === 'constant' && (
            <div data-part={RICH_PARTS.smParamRow}>
              <span>Value:</span>
              <input data-part="field-input" defaultValue="1.0" style={{ width: 80 }} />
            </div>
          )}
          {block.type === 'delay' && (
            <div data-part={RICH_PARTS.smParamRow}>
              <span>Delay:</span>
              <input data-part="field-input" defaultValue="0.1" style={{ width: 60 }} />
              <span>sec</span>
            </div>
          )}
          <div data-part={RICH_PARTS.smDialogActions}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn onClick={onClose}>OK</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimParamsDialog({
  simTime,
  onSimTimeChange,
  onClose,
}: {
  simTime: string;
  onSimTimeChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div data-part={RICH_PARTS.smDialogOverlay} onClick={onClose}>
      <div data-part={RICH_PARTS.smDialog} onClick={(e) => e.stopPropagation()}>
        <div data-part={RICH_PARTS.smDialogHeader}>Simulation Parameters</div>
        <div data-part={RICH_PARTS.smDialogBody}>
          <div data-part={RICH_PARTS.smParamRow}>
            <span>Stop Time:</span>
            <input
              data-part="field-input"
              value={simTime}
              onChange={(e) => onSimTimeChange(e.target.value)}
              style={{ width: 80 }}
            />
            <span>sec</span>
          </div>
          <div data-part={RICH_PARTS.smParamRow}>
            <span>Solver:</span>
            <select data-part="field-input">
              <option>ode45 (Dormand-Prince)</option>
              <option>ode23 (Bogacki-Shampine)</option>
              <option>ode15s (Stiff/NDF)</option>
              <option>Euler (Fixed Step)</option>
            </select>
          </div>
          <div data-part={RICH_PARTS.smParamRow}>
            <span>Max Step:</span>
            <input data-part="field-input" defaultValue="auto" style={{ width: 80 }} />
          </div>
          <div data-part={RICH_PARTS.smDialogActions}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn onClick={onClose}>OK</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SVG block rendering ──────────────────────────────────────────────

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
  onMouseDown: (e: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
  onMouseUp: (e: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
}) {
  return (
    <g
      onMouseDown={(e) => onMouseDown(e, blockId, isInput, portIdx)}
      onMouseUp={(e) => onMouseUp(e, blockId, isInput, portIdx)}
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
        {'\u25B8'}
      </text>
    </g>
  );
}

function SvgBlock({
  block,
  isSelected,
  onBlockMouseDown,
  onBlockDoubleClick,
  onPortMouseDown,
  onPortMouseUp,
}: {
  block: BlockInstance;
  isSelected: boolean;
  onBlockMouseDown: (e: React.MouseEvent, blockId: string) => void;
  onBlockDoubleClick: (blockId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
  onPortMouseUp: (e: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => void;
}) {
  return (
    <g
      onMouseDown={(e) => onBlockMouseDown(e, block.id)}
      onDoubleClick={() => onBlockDoubleClick(block.id)}
      style={{ cursor: 'grab' }}
    >
      {/* Shadow */}
      <rect x={block.x + 2} y={block.y + 2} width={block.w} height={block.h} fill="#000" />
      {/* Body */}
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
      {/* Titlebar stripe */}
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
      {/* Emoji */}
      <text
        x={block.x + block.w / 2}
        y={block.y + 16 + (block.h - 16) / 2 + 5}
        textAnchor="middle"
        fontSize={20}
        pointerEvents="none"
      >
        {block.emoji}
      </text>
      {/* Ports */}
      {Array.from({ length: block.inputs }, (_, i) => (
        <SvgPort
          key={`${block.id}-i-${i}`}
          pos={getPortPos(block, true, i)}
          isInput
          blockId={block.id}
          portIdx={i}
          onMouseDown={onPortMouseDown}
          onMouseUp={onPortMouseUp}
        />
      ))}
      {Array.from({ length: block.outputs }, (_, i) => (
        <SvgPort
          key={`${block.id}-o-${i}`}
          pos={getPortPos(block, false, i)}
          isInput={false}
          blockId={block.id}
          portIdx={i}
          onMouseDown={onPortMouseDown}
          onMouseUp={onPortMouseUp}
        />
      ))}
    </g>
  );
}

function SvgWire({
  wire,
  blocks,
  onDelete,
}: {
  wire: Wire;
  blocks: BlockInstance[];
  onDelete: (wireId: string) => void;
}) {
  const fromBlock = blocks.find((b) => b.id === wire.from);
  const toBlock = blocks.find((b) => b.id === wire.to);
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
      onClick={(e) => {
        e.stopPropagation();
        onDelete(wire.id);
      }}
      style={{ cursor: 'pointer' }}
    />
  );
}

// ── Main Component ───────────────────────────────────────────────────
export function SystemModeler({
  initialBlocks = INITIAL_BLOCKS,
  initialWires = INITIAL_WIRES,
}: SystemModelerProps = {}) {
  const [blocks, setBlocks] = useState<BlockInstance[]>(() => [...initialBlocks]);
  const [wires, setWires] = useState<Wire[]>(() => [...initialWires]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [wiring, setWiring] = useState<WiringState | null>(null);
  const [showParams, setShowParams] = useState<string | null>(null);
  const [simTime, setSimTime] = useState('10.0');
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [showPalette, setShowPalette] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(1);
  const uid = useCallback(() => `blk_${idCounterRef.current++}`, []);

  // Simulation timer
  useEffect(() => {
    if (!simRunning) return;
    const iv = setInterval(() => {
      setSimProgress((p) => {
        if (p >= 100) {
          setSimRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 80);
    return () => clearInterval(iv);
  }, [simRunning]);

  // Delete/Backspace handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if focused on an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const deleteSelected = useCallback(() => {
    if (selected) {
      setBlocks((bs) => bs.filter((b) => b.id !== selected));
      setWires((ws) => ws.filter((w) => w.from !== selected && w.to !== selected));
      setSelected(null);
    }
  }, [selected]);

  const addBlock = (bt: BlockTypeDef) => {
    const id = uid();
    setBlocks((bs) => [
      ...bs,
      {
        id,
        type: bt.type,
        label: bt.label,
        emoji: bt.emoji,
        x: 100 + Math.random() * 200,
        y: 60 + Math.random() * 200,
        w: bt.width,
        h: bt.height,
        inputs: bt.inputs,
        outputs: bt.outputs,
      },
    ]);
  };

  const clearModel = () => {
    setBlocks([]);
    setWires([]);
    setSelected(null);
  };

  const startSim = () => {
    setSimProgress(0);
    setSimRunning(true);
  };

  // Block drag
  const onBlockMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    setSelected(blockId);
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setDragging({
      blockId,
      offX: e.clientX - rect.left - block.x,
      offY: e.clientY - rect.top - block.y,
    });
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nx = e.clientX - rect.left - dragging.offX;
      const ny = e.clientY - rect.top - dragging.offY;
      setBlocks((bs) =>
        bs.map((b) =>
          b.id === dragging.blockId ? { ...b, x: Math.max(0, nx), y: Math.max(0, ny) } : b,
        ),
      );
    }
    if (wiring) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setWiring((w) => (w ? { ...w, mx: e.clientX - rect.left, my: e.clientY - rect.top } : null));
    }
  };

  const onCanvasMouseUp = () => {
    setDragging(null);
    if (wiring) setWiring(null);
  };

  // Port wiring
  const onPortMouseDown = (e: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => {
    e.stopPropagation();
    if (!isInput) {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const pos = getPortPos(block, false, portIdx);
      setWiring({ fromBlock: blockId, fromPort: portIdx, mx: pos.x, my: pos.y });
    }
  };

  const onPortMouseUp = (e: React.MouseEvent, blockId: string, isInput: boolean, portIdx: number) => {
    e.stopPropagation();
    if (wiring && isInput && wiring.fromBlock !== blockId) {
      const exists = wires.some((w) => w.to === blockId && w.toPort === portIdx);
      if (!exists) {
        setWires((ws) => [
          ...ws,
          {
            id: `w_${Date.now()}`,
            from: wiring.fromBlock,
            fromPort: wiring.fromPort,
            to: blockId,
            toPort: portIdx,
          },
        ]);
      }
    }
    setWiring(null);
  };

  const deleteWire = (wireId: string) => {
    setWires((ws) => ws.filter((w) => w.id !== wireId));
  };

  // Find block for param dialog
  const paramBlock = showParams && showParams !== 'sim'
    ? blocks.find((b) => b.id === showParams) ?? null
    : null;

  return (
    <div data-part={RICH_PARTS.systemModeler}>
      {/* Toolbar */}
      <div data-part={RICH_PARTS.smToolbar}>
        <Btn onClick={startSim} active={simRunning}>{'\u25B6'} Run</Btn>
        <Btn onClick={() => setSimRunning(false)}>{'\u23F9'}</Btn>
        <div data-part={RICH_PARTS.smSeparator} />
        <Btn onClick={deleteSelected}>{'\uD83D\uDDD1\uFE0F'} Delete</Btn>
        <Btn onClick={clearModel}>New</Btn>
        <Btn onClick={() => setShowParams('sim')}>{'\u2699\uFE0F'} Params</Btn>
        <div style={{ flex: 1 }} />
        <Btn onClick={() => setShowPalette(!showPalette)}>
          {showPalette ? 'Hide Palette' : 'Show Palette'}
        </Btn>
        <span data-part={RICH_PARTS.smTimeLabel}>
          {simRunning ? `\u23F3 ${simProgress}%` : `t = ${simTime}s`}
        </span>
      </div>

      <div data-part={RICH_PARTS.smBody}>
        {/* SVG Canvas */}
        <div data-part={RICH_PARTS.smCanvas} ref={canvasRef}>
          <svg
            width="100%"
            height="100%"
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onClick={() => setSelected(null)}
            data-part={RICH_PARTS.smSvg}
          >
            {wires.map((w) => (
              <SvgWire key={w.id} wire={w} blocks={blocks} onDelete={deleteWire} />
            ))}
            {wiring && (() => {
              const fb = blocks.find((b) => b.id === wiring.fromBlock);
              if (!fb) return null;
              const start = getPortPos(fb, false, wiring.fromPort);
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={wiring.mx}
                  y2={wiring.my}
                  stroke="#000"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              );
            })()}
            {blocks.map((b) => (
              <SvgBlock
                key={b.id}
                block={b}
                isSelected={selected === b.id}
                onBlockMouseDown={onBlockMouseDown}
                onBlockDoubleClick={setShowParams}
                onPortMouseDown={onPortMouseDown}
                onPortMouseUp={onPortMouseUp}
              />
            ))}
          </svg>
        </div>

        {/* Block Palette sidebar */}
        {showPalette && (
          <div data-part={RICH_PARTS.smPalette}>
            <div data-part={RICH_PARTS.smPaletteHeader}>Block Palette</div>
            <div data-part={RICH_PARTS.smPaletteList}>
              <PaletteSection title={'\u25C6 Sources'} blocks={SOURCE_BLOCKS} onAdd={addBlock} />
              <PaletteSection title={'\u25C6 Math Operations'} blocks={MATH_BLOCKS} onAdd={addBlock} />
              <PaletteSection title={'\u25C6 Routing & Sinks'} blocks={ROUTING_BLOCKS} onAdd={addBlock} />
            </div>
          </div>
        )}
      </div>

      {/* Simulation progress bar */}
      {simRunning && (
        <div data-part={RICH_PARTS.smProgressOverlay}>
          <div data-part={RICH_PARTS.smProgressLabel}>
            {'\u23F3'} Simulating model\u2026 {simProgress}%
          </div>
          <div data-part={RICH_PARTS.smProgressBar}>
            <div
              data-part={RICH_PARTS.smProgressFill}
              style={{ width: `${simProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status bar */}
      <div data-part={RICH_PARTS.smStatusBar}>
        <span>{blocks.length} blocks</span>
        <span>{wires.length} wires</span>
        <span>{simRunning ? '\u23F3 Simulating' : '\u2705 Ready'}</span>
      </div>

      {/* Dialogs */}
      {showParams === 'sim' && (
        <SimParamsDialog
          simTime={simTime}
          onSimTimeChange={setSimTime}
          onClose={() => setShowParams(null)}
        />
      )}
      {paramBlock && (
        <ParamsDialog
          block={paramBlock}
          onClose={() => setShowParams(null)}
        />
      )}
    </div>
  );
}
