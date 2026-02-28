import type { Meta, StoryObj } from '@storybook/react';
import { AppIcon } from './AppIcon';
import { MOCK_INVENTORY, MOCK_GEPA, MOCK_INVENTORY_UNHEALTHY } from '../mocks/fixtures/apps';
import type { AppManifestDocument } from '../domain/types';

const meta = {
  title: 'Apps/AppsBrowser/AppIcon',
  component: AppIcon,
  argTypes: {
    selected: { control: 'boolean' },
  },
} satisfies Meta<typeof AppIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HealthyOptional: Story = {
  args: {
    app: {
      app_id: 'telemetry',
      name: 'Telemetry',
      description: 'Metrics and observability',
      required: false,
      capabilities: ['metrics'],
      healthy: true,
    },
  },
};

export const HealthyRequired: Story = {
  args: { app: MOCK_INVENTORY },
};

export const HealthyReflective: Story = {
  args: { app: MOCK_GEPA },
};

export const HealthyRequiredReflective: Story = {
  args: {
    app: {
      ...MOCK_GEPA,
      required: true,
    } satisfies AppManifestDocument,
  },
};

export const UnhealthyRequired: Story = {
  args: { app: MOCK_INVENTORY_UNHEALTHY },
};

export const Selected: Story = {
  args: {
    app: MOCK_GEPA,
    selected: true,
  },
};

export const IconGrid: Story = {
  args: { app: MOCK_GEPA },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 88px)', gap: 4 }}>
      <AppIcon app={MOCK_INVENTORY} />
      <AppIcon app={MOCK_GEPA} />
      <AppIcon app={MOCK_INVENTORY_UNHEALTHY} />
      <AppIcon app={{ ...MOCK_GEPA, required: true }} />
    </div>
  ),
};
