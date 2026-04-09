export type ImageChoiceMode = 'select' | 'confirm' | 'multi';
export interface ImageChoiceItem {
    id: string;
    src: string;
    alt?: string;
    label?: string;
    badge?: string;
    disabled?: boolean;
}
export interface ImageChoiceGridProps {
    items: ImageChoiceItem[];
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    mode?: ImageChoiceMode;
    columns?: number;
    loading?: boolean;
    errorMessage?: string;
}
export declare function ImageChoiceGrid({ items, selectedIds, onSelectionChange, mode, columns, loading, errorMessage, }: ImageChoiceGridProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ImageChoiceGrid.d.ts.map