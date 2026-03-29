import { describe, expect, it } from 'vitest';
import { coerceSchemaValues, schemaToFieldConfigs, type JsonSchemaNode } from '../components/widgets/SchemaFormRenderer';

describe('SchemaFormRenderer helpers', () => {
  const schema: JsonSchemaNode = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', title: 'Name' },
      qty: { type: 'number', title: 'Quantity', default: 3 },
      status: { type: 'string', enum: ['new', 'open', 'closed'], default: 'new' },
      approved: { type: 'boolean', title: 'Approved' },
    },
  };

  it('maps schema properties to field configs', () => {
    const fields = schemaToFieldConfigs(schema);
    expect(fields).toHaveLength(4);
    expect(fields.find((f) => f.id === 'name')?.required).toBe(true);
    expect(fields.find((f) => f.id === 'qty')?.type).toBe('number');
    expect(fields.find((f) => f.id === 'status')?.type).toBe('select');
    expect(fields.find((f) => f.id === 'approved')?.type).toBe('boolean');
  });

  it('coerces number and boolean values on submit', () => {
    const next = coerceSchemaValues(schema, {
      name: 'Alpha',
      qty: '12',
      approved: 'true',
    });
    expect(next.qty).toBe(12);
    expect(next.approved).toBe(true);
  });

  it('keeps explicit boolean false values as boolean', () => {
    const next = coerceSchemaValues(schema, {
      name: 'Alpha',
      approved: false,
    });
    expect(next.approved).toBe(false);
  });
});
