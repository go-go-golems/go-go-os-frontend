import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FilePickerDropzone, type RejectedFile } from './FilePickerDropzone';

function FileDropDemo(props: {
  accept?: string[];
  multiple?: boolean;
  maxSizeBytes?: number;
  helperText?: string;
}) {
  const [accepted, setAccepted] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  const onFilesChange = (nextAccepted: File[], nextRejected: RejectedFile[]) => {
    setAccepted(nextAccepted.map((f) => `${f.name} (${f.size}b)`));
    setRejected(nextRejected.map((r) => `${r.file.name} [${r.reason}]`));
  };

  return (
    <div style={{ display: 'grid', gap: 8, width: 420 }}>
      <FilePickerDropzone
        accept={props.accept}
        multiple={props.multiple}
        maxSizeBytes={props.maxSizeBytes}
        helperText={props.helperText}
        onFilesChange={onFilesChange}
      />
      <div data-part="field-value">Accepted: {accepted.length > 0 ? accepted.join(', ') : 'none yet'}</div>
      <div data-part="field-value">Rejected: {rejected.length > 0 ? rejected.join(', ') : 'none'}</div>
    </div>
  );
}

const meta = {
  title: 'Engine/Widgets/FilePickerDropzone',
  component: FilePickerDropzone,
  tags: ['autodocs'],
  args: {
    onFilesChange: () => {},
  },
} satisfies Meta<typeof FilePickerDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    helperText: 'Drop documents here or choose from disk',
  },
};

export const ImagesOnly: Story = {
  args: {
    accept: ['image/*', '.png', '.jpg'],
    helperText: 'Accepts common image formats',
  },
};

export const SingleFileOnly: Story = {
  args: {
    multiple: false,
    accept: ['.pdf'],
    helperText: 'Single PDF upload',
  },
};

export const MaxSizeConstrained: Story = {
  args: {
    multiple: true,
    maxSizeBytes: 1024 * 1024,
    helperText: 'Max size 1MB per file',
  },
};

export const InteractiveResultPanel: Story = {
  render: () => (
    <FileDropDemo
      accept={['.json', '.csv', '.txt']}
      multiple
      maxSizeBytes={2 * 1024 * 1024}
      helperText="Drop CSV/JSON/TXT files"
    />
  ),
};

export const WideSurface: Story = {
  render: () => (
    <div style={{ width: 560 }}>
      <FileDropDemo accept={['.zip', '.tar']} multiple helperText="Archive upload area" />
    </div>
  ),
};
