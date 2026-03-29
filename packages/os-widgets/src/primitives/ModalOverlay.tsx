import type { CSSProperties, ReactNode, MouseEvent } from 'react';
import { useCallback } from 'react';
import { RICH_PARTS as P } from '../parts';

export interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}

export function ModalOverlay({ children, onClose, className, style }: ModalOverlayProps) {
  const stopProp = useCallback((e: MouseEvent) => e.stopPropagation(), []);

  return (
    <div
      data-part={P.modalOverlay}
      className={className}
      style={style}
      onClick={onClose}
    >
      <div data-part={P.modalContent} onClick={stopProp}>
        {children}
      </div>
    </div>
  );
}
