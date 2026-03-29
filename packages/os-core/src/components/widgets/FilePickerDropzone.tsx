import type { DragEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { PARTS } from '../../parts';
import { Btn } from './Btn';

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

function fileMatchesAccept(file: File, accept: string[]): boolean {
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

function classifyFiles(files: File[], accept: string[], maxSizeBytes?: number): [File[], RejectedFile[]] {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];

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

export function FilePickerDropzone({ accept, multiple, maxSizeBytes, onFilesChange, helperText }: FilePickerDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptedTypes = accept ?? [];

  const acceptLabel = useMemo(() => {
    if (acceptedTypes.length === 0) {
      return 'any file type';
    }
    return acceptedTypes.join(', ');
  }, [acceptedTypes]);

  const handleFiles = (selectedFiles: File[]) => {
    const [accepted, rejected] = classifyFiles(selectedFiles, acceptedTypes, maxSizeBytes);
    setFiles(accepted);
    onFilesChange?.(accepted, rejected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div data-part={PARTS.confirmWidgetBody}>
      <div
        data-part={PARTS.confirmDropzone}
        data-state={dragOver ? 'drag-over' : undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
      >
        {helperText ?? 'Drag files here or choose from disk'}
      </div>

      <input
        ref={inputRef}
        data-part={PARTS.fieldInput}
        type="file"
        style={{ display: 'none' }}
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={(event) => {
          const selected = event.target.files ? Array.from(event.target.files) : [];
          handleFiles(selected);
        }}
      />

      <div data-part={PARTS.confirmActionButtons} style={{ justifyContent: 'flex-start' }}>
        <Btn variant="default" onClick={() => inputRef.current?.click()}>
          Choose File{multiple ? 's' : ''}
        </Btn>
        <span data-part={PARTS.confirmProgress}>
          Accept: {acceptLabel}
          {maxSizeBytes !== undefined ? `, max ${Math.round(maxSizeBytes / (1024 * 1024))}MB` : ''}
        </span>
      </div>

      {files.length > 0 && (
        <div data-part={PARTS.confirmFileList}>
          {files.map((file) => (
            <div key={`${file.name}:${file.size}`} data-part={PARTS.confirmFileItem}>
              {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
