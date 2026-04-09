import type { FilterConfig } from './types';
export interface FilterBarProps {
    filters: FilterConfig[];
    values: Record<string, string>;
    onChange: (field: string, value: string) => void;
}
export declare function FilterBar({ filters, values, onChange }: FilterBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FilterBar.d.ts.map