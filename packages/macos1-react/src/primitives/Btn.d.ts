import type { ButtonHTMLAttributes, ReactNode } from 'react';
export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    active?: boolean;
    /** Visual emphasis for the default/primary action (draws outer ring). */
    isDefault?: boolean;
    variant?: 'default' | 'primary' | 'danger';
}
export declare function Btn({ children, active, isDefault, variant, style, ...rest }: BtnProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Btn.d.ts.map