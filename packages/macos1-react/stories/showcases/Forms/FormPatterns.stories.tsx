import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FormView } from '../../../src/primitives/FormView';
import { FieldRow } from '../../../src/primitives/FieldRow';
import { FilterBar } from '../../../src/primitives/FilterBar';
import { FilePickerDropzone } from '../../../src/primitives/FilePickerDropzone';
import { RatingPicker } from '../../../src/primitives/RatingPicker';
import { RequestActionBar } from '../../../src/primitives/RequestActionBar';
import type { FieldConfig, FilterConfig } from '../../../src/primitives/types';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Fixture data ──

const PRODUCT_FIELDS: FieldConfig[] = [
  { id: 'name', label: 'Product Name', type: 'text', placeholder: 'Enter product name', required: true },
  { id: 'sku', label: 'SKU', type: 'text', placeholder: 'Auto-generated', readOnly: true },
  { id: 'category', label: 'Category', type: 'select', options: ['Electronics', 'Accessories', 'Software', 'Services'] },
  { id: 'price', label: 'Price ($)', type: 'number', step: 0.01, defaultValue: 0 },
  { id: 'quantity', label: 'Quantity', type: 'number', defaultValue: 0 },
  { id: 'description', label: 'Description', type: 'text' },
];

const FILTER_CONFIG: FilterConfig[] = [
  { field: 'status', type: 'select', options: ['All', 'Draft', 'Published', 'Archived'] },
  { field: 'category', type: 'select', options: ['All', 'Electronics', 'Accessories'] },
  { field: '_search', type: 'text', placeholder: 'Search products...' },
];

// ── FormPatterns component ──

function FormPatternsInner() {
  // Form state
  const [formValues, setFormValues] = useState<Record<string, unknown>>({
    name: '',
    sku: 'AUTO-0001',
    category: 'Electronics',
    price: 0,
    quantity: 0,
    description: '',
  });
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  // Filter state
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // File state
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  // Rating state
  const [rating, setRating] = useState(4);

  // Action bar state
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleFilesChange = (accepted: File[], rejected: { file: File; reason: string }[]) => {
    setUploadedFiles(accepted.map((f) => f.name));
    setRejectedFiles(rejected.map((r) => `${r.file.name} [${r.reason}]`));
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 520,
      }}
    >
      {/* ── Header ── */}
      <h1
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 16,
          borderBottom: '1px solid #ccc',
          paddingBottom: 8,
        }}
      >
        Form Patterns
      </h1>

      {/* ── FormView ── */}
      <div style={SECTION_LABEL_STYLE}>FormView</div>
      <FormView
        fields={PRODUCT_FIELDS}
        values={formValues}
        onChange={(id, value) => setFormValues((prev) => ({ ...prev, [id]: value }))}
        onSubmit={(values) => {
          setSubmitResult(`Submitted: ${JSON.stringify(values)}`);
        }}
        submitResult={submitResult}
        submitLabel="💾 Save Product"
      />

      {/* ── FieldRow Examples ── */}
      <div style={{ marginTop: 24 }}>
        <div style={SECTION_LABEL_STYLE}>FieldRow Variants</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <FieldRow
            field={{ id: 'title', label: 'Title', type: 'text', placeholder: 'Enter title' }}
            value=""
            onChange={() => {}}
          />
          <FieldRow
            field={{ id: 'count', label: 'Count', type: 'number', step: 1 }}
            value={42}
            onChange={() => {}}
          />
          <FieldRow
            field={{ id: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }}
            value="Active"
            onChange={() => {}}
          />
          <FieldRow
            field={{ id: 'readonly', label: 'Read Only', type: 'readonly' }}
            value="This field cannot be edited"
            onChange={() => {}}
          />
        </div>
      </div>

      {/* ── FilterBar ── */}
      <div style={{ marginTop: 16 }}>
        <div style={SECTION_LABEL_STYLE}>FilterBar</div>
        <FilterBar
          filters={FILTER_CONFIG}
          values={filterValues}
          onChange={(field, value) => setFilterValues((prev) => ({ ...prev, [field]: value }))}
        />
        <div style={{ fontSize: 10, color: '#666', marginTop: 8 }}>
          Current filters: {JSON.stringify(filterValues) || 'none'}
        </div>
      </div>

      {/* ── FilePicker ── */}
      <div style={{ marginTop: 16 }}>
        <div style={SECTION_LABEL_STYLE}>FilePickerDropzone</div>
        <div style={{ marginBottom: 8 }}>
          <FilePickerDropzone
            accept={['.pdf', '.doc', '.docx', '.png', '.jpg']}
            multiple
            helperText="Drop documents or images here"
            onFilesChange={handleFilesChange}
          />
        </div>
        {uploadedFiles.length > 0 && (
          <div style={{ fontSize: 11 }}>
            <div>✓ Accepted: {uploadedFiles.join(', ')}</div>
          </div>
        )}
        {rejectedFiles.length > 0 && (
          <div style={{ fontSize: 11, color: '#a00' }}>
            ✗ Rejected: {rejectedFiles.join(', ')}
          </div>
        )}
      </div>

      {/* ── RatingPicker ── */}
      <div style={{ marginTop: 16 }}>
        <div style={SECTION_LABEL_STYLE}>RatingPicker</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <RatingPicker scale={5} style="stars" value={rating} onChange={setRating} />
            <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Current: {rating} stars</div>
          </div>
          <div>
            <RatingPicker scale={5} style="numbers" value={3} onChange={() => {}} />
            <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Numbers style</div>
          </div>
        </div>
      </div>

      {/* ── RequestActionBar ── */}
      <div style={{ marginTop: 16 }}>
        <div style={SECTION_LABEL_STYLE}>RequestActionBar</div>
        <RequestActionBar
          commentEnabled
          commentValue={comment}
          onCommentChange={setComment}
          busy={busy}
          primaryLabel="Approve"
          secondaryLabel="Reject"
          onPrimary={(c) => {
            setBusy(true);
            setTimeout(() => {
              setLastAction(`Approved${c ? ` with comment: "${c}"` : ''}`);
              setBusy(false);
            }, 500);
          }}
          onSecondary={(c) => setLastAction(`Rejected${c ? ` with comment: "${c}"` : ''}`)}
        />
        {lastAction && (
          <div style={{ fontSize: 11, color: '#060', marginTop: 8 }}>
            ✓ {lastAction}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Forms/FormPatterns',
  component: FormPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating form widgets: FormView, FieldRow, FilterBar, FilePickerDropzone, RatingPicker, and RequestActionBar.',
      },
    },
  },
} satisfies Meta<typeof FormPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormPatterns: Story = {};
