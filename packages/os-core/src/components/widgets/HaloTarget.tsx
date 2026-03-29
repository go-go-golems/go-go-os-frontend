import { useState, type ReactNode } from 'react';
import { PARTS } from '../../parts';

export type HaloPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface HaloHandleDef {
  id: string;
  position: HaloPosition;
  color: string;
  icon: string;
  label: string;
}

export interface HaloTargetProps {
  label: string;
  children: ReactNode;
  handles?: HaloHandleDef[];
  onHandle?: (handleId: string) => void;
}

const DEFAULT_HANDLES: HaloHandleDef[] = [
  { id: 'delete', position: 'top-left', color: '#e22', icon: '✕', label: 'Delete' },
  { id: 'inspect', position: 'top-center', color: '#28f', icon: '🔍', label: 'Inspect' },
  { id: 'duplicate', position: 'top-right', color: '#2a2', icon: '📋', label: 'Duplicate' },
  { id: 'rotate', position: 'middle-left', color: '#f80', icon: '🔄', label: 'Rotate' },
  { id: 'resize', position: 'middle-right', color: '#a3f', icon: '↔️', label: 'Resize' },
  { id: 'browse', position: 'bottom-left', color: '#0bb', icon: '👁️', label: 'Browse' },
  { id: 'grab', position: 'bottom-center', color: '#f5a', icon: '✋', label: 'Grab' },
  { id: 'debug', position: 'bottom-right', color: '#cb0', icon: '📐', label: 'Debug' },
];

const POSITION_STYLES: Record<HaloPosition, { left: string; top: string }> = {
  'top-left': { left: '-12px', top: '-12px' },
  'top-center': { left: 'calc(50% - 10px)', top: '-12px' },
  'top-right': { left: 'calc(100% - 8px)', top: '-12px' },
  'middle-left': { left: '-12px', top: 'calc(50% - 10px)' },
  'middle-right': { left: 'calc(100% - 8px)', top: 'calc(50% - 10px)' },
  'bottom-left': { left: '-12px', top: 'calc(100% - 8px)' },
  'bottom-center': { left: 'calc(50% - 10px)', top: 'calc(100% - 8px)' },
  'bottom-right': { left: 'calc(100% - 8px)', top: 'calc(100% - 8px)' },
};

export function HaloTarget({ label, children, handles, onHandle }: HaloTargetProps) {
  const [showHalo, setShowHalo] = useState(false);
  const resolvedHandles = handles ?? DEFAULT_HANDLES;

  return (
    <div
      data-part={PARTS.haloTarget}
      onMouseEnter={() => setShowHalo(true)}
      onMouseLeave={() => setShowHalo(false)}
    >
      {showHalo && (
        <>
          <div data-part={PARTS.haloBorder} />
          {resolvedHandles.map((h) => (
            <div
              key={h.id}
              data-part={PARTS.haloHandle}
              title={h.label}
              style={{
                ...POSITION_STYLES[h.position],
                background: h.color,
              }}
              onClick={() => onHandle?.(h.id)}
            >
              {h.icon}
            </div>
          ))}
          <div data-part={PARTS.haloLabel}>{label}</div>
        </>
      )}
      <div style={{ position: 'relative', zIndex: 5 }}>{children}</div>
    </div>
  );
}
