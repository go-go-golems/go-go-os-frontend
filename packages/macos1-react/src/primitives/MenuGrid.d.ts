import type { ActionConfig } from './types';
export interface MenuGridProps {
    icon?: string;
    labels?: Array<{
        value: string;
        style?: string;
    }>;
    buttons: ActionConfig[];
    onAction: (action: unknown) => void;
}
export declare function MenuGrid({ icon, labels, buttons, onAction }: MenuGridProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MenuGrid.d.ts.map