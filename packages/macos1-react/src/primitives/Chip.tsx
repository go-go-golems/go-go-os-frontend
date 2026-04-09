import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Chip({ children, ...rest }: ChipProps) {
  return (
    <button data-part="chip" {...rest}>
      {children}
    </button>
  );
}
