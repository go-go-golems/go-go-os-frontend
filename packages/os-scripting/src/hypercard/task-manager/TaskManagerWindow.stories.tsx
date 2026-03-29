import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { TaskManagerWindow } from './TaskManagerWindow';
import {
  clearTaskManagerSources,
  registerTaskManagerSource,
} from './taskManagerRegistry';
import type { TaskManagerSource } from './types';

function SourceHarness() {
  useEffect(() => {
    const runtimeSource: TaskManagerSource = {
      sourceId: () => 'runtime',
      title: () => 'Runtime Sessions',
      listRows: () => [
        {
          id: 'session-1',
          kind: 'runtime-session',
          sourceId: 'runtime',
          sourceTitle: 'Runtime Sessions',
          title: 'Inventory · lowStock',
          status: 'ready',
          details: {
            bundleId: 'inventory',
            currentSurface: 'lowStock',
          },
          actions: [
            { id: 'open', label: 'Open', intent: 'open' },
            { id: 'inspect', label: 'Inspect', intent: 'inspect' },
          ],
        },
      ],
      invoke: () => undefined,
      subscribe: () => () => undefined,
    };
    const jsSource: TaskManagerSource = {
      sourceId: () => 'js',
      title: () => 'JavaScript Sessions',
      listRows: () => [
        {
          id: 'js-1',
          kind: 'js-session',
          sourceId: 'js',
          sourceTitle: 'JavaScript Sessions',
          title: 'Scratch Pad',
          status: 'ready',
          startedAt: '2026-03-11T18:45:00-04:00',
          details: {
            globals: '5',
            globalsPreview: 'x, y, render',
          },
          actions: [
            { id: 'focus', label: 'Focus', intent: 'focus' },
            { id: 'reset', label: 'Reset', intent: 'reset' },
            { id: 'dispose', label: 'Dispose', intent: 'dispose' },
          ],
        },
      ],
      invoke: () => undefined,
      subscribe: () => () => undefined,
    };

    registerTaskManagerSource(runtimeSource);
    registerTaskManagerSource(jsSource);
    return () => {
      clearTaskManagerSources();
    };
  }, []);

  return <TaskManagerWindow />;
}

const meta: Meta<typeof SourceHarness> = {
  title: 'HypercardRuntime/TaskManager/TaskManagerWindow',
  component: SourceHarness,
};

export default meta;

type Story = StoryObj<typeof SourceHarness>;

export const MixedSources: Story = {};
