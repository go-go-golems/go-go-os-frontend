import { type ReactNode } from 'react';
export type HaloPosition = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
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
export declare function HaloTarget({ label, children, handles, onHandle }: HaloTargetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=HaloTarget.d.ts.map