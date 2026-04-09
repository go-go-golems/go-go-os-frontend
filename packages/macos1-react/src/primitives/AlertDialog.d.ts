export type AlertDialogType = 'stop' | 'caution' | 'note';
export interface AlertDialogAction {
    label: string;
    onClick: () => void;
    isDefault?: boolean;
}
export interface AlertDialogProps {
    type: AlertDialogType;
    message: string;
    onOK?: () => void;
    actions?: AlertDialogAction[];
}
export declare function AlertDialog({ type, message, onOK, actions }: AlertDialogProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AlertDialog.d.ts.map