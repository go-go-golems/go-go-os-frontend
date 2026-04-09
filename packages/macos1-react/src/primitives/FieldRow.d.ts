import type { CSSProperties } from 'react';
import type { FieldConfig } from './types';
export interface FieldRowProps {
    field: FieldConfig;
    value: unknown;
    onChange: (value: unknown) => void;
    style?: CSSProperties;
}
export declare function FieldRow({ field, value, onChange, style }: FieldRowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FieldRow.d.ts.map