export interface ListBoxProps {
    items: string[];
    selected: number;
    onSelect: (index: number) => void;
    height?: number | string;
    width?: number | string;
}
export declare function ListBox({ items, selected, onSelect, height, width }: ListBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ListBox.d.ts.map