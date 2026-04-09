export type RatingStyle = 'numbers' | 'stars' | 'emoji' | 'slider';
export interface RatingPickerProps {
    scale?: number;
    style?: RatingStyle;
    value?: number;
    disabled?: boolean;
    lowLabel?: string;
    highLabel?: string;
    onChange?: (value: number) => void;
}
export declare function RatingPicker({ scale, style, value, disabled, lowLabel, highLabel, onChange, }: RatingPickerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RatingPicker.d.ts.map