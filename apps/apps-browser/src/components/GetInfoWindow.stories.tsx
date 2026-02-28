import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { createDefaultAppsHandlers } from '../mocks/msw/defaultHandlers';
import { MOCK_GEPA, MOCK_INVENTORY, MOCK_INVENTORY_UNHEALTHY } from '../mocks/fixtures/apps';
import { GetInfoWindow } from './GetInfoWindow';

function StoreDecorator(Story: React.ComponentType) {
  const store = createAppsBrowserStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/AppsBrowser/GetInfoWindow',
  component: GetInfoWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof GetInfoWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReflectiveModule: Story = {
  args: { app: MOCK_GEPA },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const NonReflectiveModule: Story = {
  args: { app: MOCK_INVENTORY },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const UnhealthyRequired: Story = {
  args: { app: MOCK_INVENTORY_UNHEALTHY },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const ReflectionLoading: Story = {
  args: { app: MOCK_GEPA },
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({}, { delayMs: 60000 }),
    },
  },
};
