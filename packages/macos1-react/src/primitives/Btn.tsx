import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  /** Visual emphasis for the default/primary action (draws outer ring). */
  isDefault?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export function Btn({ children, active, isDefault, variant, style, ...rest }: BtnProps) {
  const state = isDefault ? 'default' : active ? 'active' : undefined;
  return (
    <button
      data-part="btn"
      data-state={state}
      data-variant={variant !== 'default' ? variant : undefined}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
