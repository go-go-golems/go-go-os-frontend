import type { Meta, StoryObj } from '@storybook/react';
import {
  composeDesktopContributions,
  routeContributionCommand,
  type DesktopCommandContext,
  type DesktopContribution,
} from './desktopContributions';

interface ContributionsContractStoryProps {
  commandId: string;
}

function evaluateContributions(commandId: string) {
  const trace: string[] = [];
  const contributions: DesktopContribution[] = [
    {
      id: 'core.shell',
      menus: [
        {
          id: 'window',
          label: 'Window',
          items: [{ id: 'tile', label: 'Tile', commandId: 'window.tile' }],
        },
      ],
      icons: [{ id: 'chat', label: 'Chat', icon: '💬' }],
      commands: [
        {
          id: 'core.tile',
          priority: 10,
          matches: (id) => id === 'window.tile',
          run: () => {
            trace.push('core.tile(pass)');
            return 'pass';
          },
        },
      ],
    },
    {
      id: 'inventory.desktop',
      menus: [
        {
          id: 'window',
          label: 'Window',
          items: [{ id: 'cascade', label: 'Cascade', commandId: 'window.cascade' }],
        },
      ],
      icons: [{ id: 'inventory', label: 'Inventory', icon: '📦' }],
      commands: [
        {
          id: 'inventory.tile',
          priority: 100,
          matches: (id) => id === 'window.tile',
          run: () => {
            trace.push('inventory.tile(handled)');
            return 'handled';
          },
        },
      ],
    },
  ];

  const composed = composeDesktopContributions(contributions);
  const ctx: DesktopCommandContext = {
    dispatch: () => undefined,
    focusedWindowId: 'window:focused',
    openSurfaceWindow: (cardId) => trace.push(`openSurfaceWindow(${cardId})`),
    closeWindow: (windowId) => trace.push(`closeWindow(${windowId})`),
  };
  const handled = routeContributionCommand(commandId, composed.commandHandlers, ctx);

  return {
    contributions,
    composed,
    handled,
    trace,
  };
}

function ContributionsContractStory({ commandId }: ContributionsContractStoryProps) {
  const result = evaluateContributions(commandId);
  return (
    <div
      style={{
        width: 780,
        maxWidth: '100%',
        padding: 16,
        border: '1px solid #111',
        background: '#f2f2f2',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Desktop contribution contract fixture</h3>
      <p style={{ marginTop: 0 }}>
        Shows deterministic merge and command-routing behavior for composed desktop contributions.
      </p>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(
          {
            commandId,
            handled: result.handled,
            commandOrder: result.composed.commandHandlers.map((h) => h.id),
            menuIds: result.composed.menus.map((m) => m.id),
            menuItemIds: result.composed.menus.flatMap((m) =>
              m.items.map((item) => ('id' in item ? item.id : 'sep')),
            ),
            iconIds: result.composed.icons.map((i) => i.id),
            startupWindowCount: result.composed.startupWindows.length,
            trace: result.trace,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Contracts/DesktopContributions',
  component: ContributionsContractStory,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ContributionsContractStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TileCommandHandledByHighestPriority: Story = {
  args: {
    commandId: 'window.tile',
  },
};

export const UnmatchedCommandFallsThrough: Story = {
  args: {
    commandId: 'window.unknown',
  },
};
