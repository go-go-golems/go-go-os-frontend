import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { GenericRenderer } from './builtin/GenericRenderer';
import { LogRenderer } from './builtin/LogRenderer';
import { MessageRenderer } from './builtin/MessageRenderer';
import { StatusRenderer } from './builtin/StatusRenderer';
import { ToolCallRenderer } from './builtin/ToolCallRenderer';
import { ToolResultRenderer } from './builtin/ToolResultRenderer';
import type { RenderEntity, TimelineRenderer } from './types';

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  );
}

const meta = {
  title: 'ChatRuntime/Renderers/ChatTimelineRenderers',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function withFrame(entity: RenderEntity, Renderer: TimelineRenderer) {
  return (
    <Frame>
      <Renderer e={entity} />
    </Frame>
  );
}

export const Message: Story = {
  render: () =>
    withFrame(
      {
        id: 'm1',
        kind: 'message',
        createdAt: Date.now(),
        props: {
          role: 'assistant',
          content: 'Inventory sync is complete. 2 items are below reorder threshold.',
          streaming: false,
        },
      },
      MessageRenderer
    ),
};

export const MessageStreaming: Story = {
  render: () =>
    withFrame(
      {
        id: 'm2',
        kind: 'message',
        createdAt: Date.now(),
        props: {
          role: 'assistant',
          content: 'Thinking through shipment options',
          streaming: true,
        },
      },
      MessageRenderer
    ),
};

export const ToolCall: Story = {
  render: () =>
    withFrame(
      {
        id: 't1',
        kind: 'tool_call',
        createdAt: Date.now(),
        props: {
          name: 'inventory.lookup',
          input: { sku: 'WA-100' },
          done: false,
        },
      },
      ToolCallRenderer
    ),
};

export const ToolResult: Story = {
  render: () =>
    withFrame(
      {
        id: 'r1',
        kind: 'tool_result',
        createdAt: Date.now(),
        props: {
          customKind: 'inventory.lookup.v1',
          result: '{"sku":"WA-100","qty":2}',
        },
      },
      ToolResultRenderer
    ),
};

export const Status: Story = {
  render: () =>
    withFrame(
      {
        id: 's1',
        kind: 'status',
        createdAt: Date.now(),
        props: {
          status: 'syncing',
          tone: 'info',
          detail: 'Hydrating timeline from server snapshot.',
        },
      },
      StatusRenderer
    ),
};

export const Log: Story = {
  render: () =>
    withFrame(
      {
        id: 'l1',
        kind: 'log',
        createdAt: Date.now(),
        props: {
          level: 'warn',
          message: 'Tool call exceeded expected runtime budget.',
          fields: { convId: 'conv-123', tool: 'inventory.lookup' },
        },
      },
      LogRenderer
    ),
};

export const Generic: Story = {
  render: () =>
    withFrame(
      {
        id: 'g1',
        kind: 'custom_kind',
        createdAt: Date.now(),
        props: {
          payload: { foo: 'bar' },
        },
      },
      GenericRenderer
    ),
};
