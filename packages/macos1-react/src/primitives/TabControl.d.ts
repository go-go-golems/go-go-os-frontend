import { type ReactNode } from 'react';
export interface TabControlProps {
    tabs: string[];
    activeTab: number;
    onTabChange: (index: number) => void;
    children: ReactNode;
}
export declare function TabControl({ tabs, activeTab, onTabChange, children }: TabControlProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TabControl.d.ts.map