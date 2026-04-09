export interface RequestActionBarProps {
    primaryLabel?: string;
    secondaryLabel?: string;
    onPrimary: (comment?: string) => void;
    onSecondary?: (comment?: string) => void;
    commentEnabled?: boolean;
    commentPlaceholder?: string;
    commentValue?: string;
    onCommentChange?: (value: string) => void;
    busy?: boolean;
    primaryDisabled?: boolean;
    secondaryDisabled?: boolean;
}
export declare function RequestActionBar({ primaryLabel, secondaryLabel, onPrimary, onSecondary, commentEnabled, commentPlaceholder, commentValue, onCommentChange, busy, primaryDisabled, secondaryDisabled, }: RequestActionBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RequestActionBar.d.ts.map