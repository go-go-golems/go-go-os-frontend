import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { FieldConfig } from '../../types';
import { FormView } from './FormView';

const fields: FieldConfig[] = [
  { id: 'name', label: 'Name', type: 'text', placeholder: 'Enter name', required: true },
  { id: 'category', label: 'Category', type: 'select', options: ['A', 'B', 'C'] },
  { id: 'qty', label: 'Quantity', type: 'number', defaultValue: 0 },
];

function FormDemo() {
  const [values, setValues] = useState<Record<string, unknown>>({ name: '', category: 'A', qty: 0 });
  const [result, setResult] = useState<string | null>(null);
  return (
    <FormView
      fields={fields}
      values={values}
      onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
      onSubmit={(v) => {
        setResult(`Created: ${JSON.stringify(v)}`);
      }}
      submitResult={result}
      submitLabel="💾 Create"
    />
  );
}

const meta = {
  title: 'Engine/Widgets/FormView',
  component: FormDemo,
} satisfies Meta<typeof FormDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
