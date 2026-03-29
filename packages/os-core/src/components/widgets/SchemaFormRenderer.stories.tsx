import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SchemaFormRenderer, type JsonSchemaNode } from './SchemaFormRenderer';

const BASIC_SCHEMA: JsonSchemaNode = {
  type: 'object',
  required: ['title', 'priority'],
  properties: {
    title: { type: 'string', title: 'Title', description: 'Short request title' },
    priority: { type: 'string', title: 'Priority', enum: ['low', 'medium', 'high'], default: 'medium' },
    quantity: { type: 'number', title: 'Quantity', default: 1 },
    approved: { type: 'boolean', title: 'Approved', default: false },
  },
};

const READONLY_SCHEMA: JsonSchemaNode = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', title: 'Name' },
    sku: { type: 'string', title: 'SKU', readOnly: true, default: 'A-1001' },
    category: { type: 'string', title: 'Category', enum: ['tools', 'parts', 'accessories'] },
  },
};

const EDGE_SCHEMA: JsonSchemaNode = {
  type: 'object',
  properties: {
    notes: { type: 'string', title: 'Notes' },
    json_blob: { type: 'object', title: 'JSON Blob (fallback text)' },
    tags: { type: 'array', title: 'Tags (fallback text)' },
  },
};

function InteractiveSchemaDemo({ schema, initial }: { schema: JsonSchemaNode; initial?: Record<string, unknown> }) {
  const [value, setValue] = useState<Record<string, unknown>>(initial ?? {});
  const [submitted, setSubmitted] = useState<string>('none');

  return (
    <div style={{ display: 'grid', gap: 8, width: 440 }}>
      <SchemaFormRenderer
        schema={schema}
        value={value}
        onValueChange={setValue}
        onSubmit={(nextValue) => setSubmitted(JSON.stringify(nextValue))}
        submitLabel="Submit"
      />
      <div data-part="field-value">Current: {JSON.stringify(value)}</div>
      <div data-part="field-value">Submitted: {submitted}</div>
    </div>
  );
}

const meta = {
  title: 'Engine/Widgets/SchemaFormRenderer',
  component: SchemaFormRenderer,
  tags: ['autodocs'],
  args: {
    schema: BASIC_SCHEMA,
    onSubmit: () => {},
  },
} satisfies Meta<typeof SchemaFormRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithInitialValue: Story = {
  args: {
    value: {
      title: 'Approve seasonal purchase',
      priority: 'high',
      quantity: 6,
      approved: true,
    },
  },
};

export const ReadOnlyFields: Story = {
  args: {
    schema: READONLY_SCHEMA,
    value: { name: 'Wrench Kit' },
  },
};

export const EdgeFallbackFields: Story = {
  args: {
    schema: EDGE_SCHEMA,
    value: { notes: 'Review required', json_blob: '{"a":1}', tags: 'tag-a,tag-b' },
  },
};

export const InteractiveControlled: Story = {
  render: () => <InteractiveSchemaDemo schema={BASIC_SCHEMA} initial={{ title: 'Restock bolts', approved: false }} />,
};

export const NumberBooleanCoercion: Story = {
  render: () => (
    <InteractiveSchemaDemo
      schema={BASIC_SCHEMA}
      initial={{ title: 'String coercion demo', quantity: '12', approved: 'true' }}
    />
  ),
};
