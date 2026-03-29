import { useState, type ReactNode } from 'react';
import { PARTS } from '../../parts';

export interface DisclosureTriangleProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function DisclosureTriangle({ label, defaultOpen = false, children }: DisclosureTriangleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div data-part={PARTS.disclosureTriangle} data-state={open ? 'open' : undefined}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span data-part={PARTS.disclosureTriangleArrow}>▶</span>
        <span>{label}</span>
      </div>
      <div data-part={PARTS.disclosureTriangleContent}>{children}</div>
    </div>
  );
}
