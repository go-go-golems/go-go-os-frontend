import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FieldRow } from './FieldRow';

function TextFieldDemo() {
  const [value, setValue] = useState<unknown>('Hello');
  return <FieldRow field={{ id: 'name', label: 'Name', type: 'text' }} value={value} onChange={setValue} />;
}

function NumberFieldDemo() {
  const [value, setValue] = useState<unknown>(42);
  return <FieldRow field={{ id: 'qty', label: 'Quantity', type: 'number' }} value={value} onChange={setValue} />;
}

function ReadonlyDemo() {
  return <FieldRow field={{ id: 'sku', label: 'SKU', type: 'readonly' }} value="A-1002" onChange={() => {}} />;
}

function SelectDemo() {
  const [value, setValue] = useState<unknown>('Kitchen');
  return (
    <FieldRow
      field={{ id: 'category', label: 'Category', type: 'select', options: ['Accessories', 'Kitchen', 'Home'] }}
      value={value}
      onChange={setValue}
    />
  );
}

const meta = {
  title: 'Engine/Widgets/FieldRow',
  component: TextFieldDemo,
} satisfies Meta<typeof TextFieldDemo>;

export default meta;

export const Text: StoryObj = { render: () => <TextFieldDemo /> };
export const NumberField: StoryObj = { render: () => <NumberFieldDemo /> };
export const Readonly: StoryObj = { render: () => <ReadonlyDemo /> };
export const Select: StoryObj = { render: () => <SelectDemo /> };
