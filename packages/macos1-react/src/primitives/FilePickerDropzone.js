import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef, useState } from 'react';
import { PARTS } from '../parts/parts';
import { Btn } from './Btn';
function fileMatchesAccept(file, accept) {
    if (accept.length === 0) {
        return true;
    }
    const lowerName = file.name.toLowerCase();
    return accept.some((entry) => {
        const lowerEntry = entry.toLowerCase().trim();
        if (!lowerEntry) {
            return false;
        }
        if (lowerEntry.startsWith('.')) {
            return lowerName.endsWith(lowerEntry);
        }
        if (lowerEntry.endsWith('/*')) {
            return file.type.toLowerCase().startsWith(lowerEntry.slice(0, -1));
        }
        return file.type.toLowerCase() === lowerEntry;
    });
}
function classifyFiles(files, accept, maxSizeBytes) {
    const accepted = [];
    const rejected = [];
    for (const file of files) {
        if (!fileMatchesAccept(file, accept)) {
            rejected.push({ file, reason: 'invalid-type' });
            continue;
        }
        if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
            rejected.push({ file, reason: 'too-large' });
            continue;
        }
        accepted.push(file);
    }
    return [accepted, rejected];
}
export function FilePickerDropzone({ accept, multiple, maxSizeBytes, onFilesChange, helperText }) {
    const [files, setFiles] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);
    const acceptedTypes = accept ?? [];
    const acceptLabel = useMemo(() => {
        if (acceptedTypes.length === 0) {
            return 'any file type';
        }
        return acceptedTypes.join(', ');
    }, [acceptedTypes]);
    const handleFiles = (selectedFiles) => {
        const [accepted, rejected] = classifyFiles(selectedFiles, acceptedTypes, maxSizeBytes);
        setFiles(accepted);
        onFilesChange?.(accepted, rejected);
    };
    const onDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        handleFiles(Array.from(event.dataTransfer.files));
    };
    return (_jsxs("div", { "data-part": PARTS.confirmWidgetBody, children: [_jsx("div", { "data-part": PARTS.confirmDropzone, "data-state": dragOver ? 'drag-over' : undefined, onDragEnter: (event) => {
                    event.preventDefault();
                    setDragOver(true);
                }, onDragOver: (event) => {
                    event.preventDefault();
                    setDragOver(true);
                }, onDragLeave: (event) => {
                    event.preventDefault();
                    setDragOver(false);
                }, onDrop: onDrop, children: helperText ?? 'Drag files here or choose from disk' }), _jsx("input", { ref: inputRef, "data-part": PARTS.fieldInput, type: "file", style: { display: 'none' }, multiple: multiple, accept: acceptedTypes.join(','), onChange: (event) => {
                    const selected = event.target.files ? Array.from(event.target.files) : [];
                    handleFiles(selected);
                } }), _jsxs("div", { "data-part": PARTS.confirmActionButtons, style: { justifyContent: 'flex-start' }, children: [_jsxs(Btn, { variant: "default", onClick: () => inputRef.current?.click(), children: ["Choose File", multiple ? 's' : ''] }), _jsxs("span", { "data-part": PARTS.confirmProgress, children: ["Accept: ", acceptLabel, maxSizeBytes !== undefined ? `, max ${Math.round(maxSizeBytes / (1024 * 1024))}MB` : ''] })] }), files.length > 0 && (_jsx("div", { "data-part": PARTS.confirmFileList, children: files.map((file) => (_jsxs("div", { "data-part": PARTS.confirmFileItem, children: [file.name, " (", Math.max(1, Math.round(file.size / 1024)), " KB)"] }, `${file.name}:${file.size}`))) }))] }));
}
//# sourceMappingURL=FilePickerDropzone.js.map