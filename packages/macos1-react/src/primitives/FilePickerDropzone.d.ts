export interface RejectedFile {
    file: File;
    reason: 'invalid-type' | 'too-large';
}
export interface FilePickerDropzoneProps {
    accept?: string[];
    multiple?: boolean;
    maxSizeBytes?: number;
    onFilesChange?: (accepted: File[], rejected: RejectedFile[]) => void;
    helperText?: string;
}
export declare function FilePickerDropzone({ accept, multiple, maxSizeBytes, onFilesChange, helperText }: FilePickerDropzoneProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FilePickerDropzone.d.ts.map