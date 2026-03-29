import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { LogViewer } from './LogViewer';
import { generateSampleLogs } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createLogViewerStateSeed,
  LOG_VIEWER_STATE_KEY,
  logViewerActions,
  logViewerReducer,
} from './logViewerState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof LogViewer> = {
  title: 'RichWidgets/LogViewer',
  component: LogViewer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

const serviceLogs = generateSampleLogs(120).map((log) => ({
  ...log,
  service: 'api-gateway',
}));

const denseWarnLogs = generateSampleLogs(180).map((log, index) => ({
  ...log,
  level: index % 4 === 0 ? 'ERROR' : 'WARN',
  service: index % 2 === 0 ? 'scheduler' : 'worker-queue',
}));

function createLogViewerStoryStore() {
  return configureStore({
    reducer: {
      [LOG_VIEWER_STATE_KEY]: logViewerReducer,
    },
  });
}

type LogViewerStoryStore = ReturnType<typeof createLogViewerStoryStore>;
type LogViewerSeedStore = SeedStore<LogViewerStoryStore>;

function renderWithStore(
  seedStore: LogViewerSeedStore,
  height: string | number = '100vh',
) {
  return () => (
    <SeededStoreProvider
      createStore={createLogViewerStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height }}>
        <LogViewer />
      </div>
    </SeededStoreProvider>
  );
}

export const Default: Story = {
  args: {
    initialLogs: generateSampleLogs(200),
  },
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  args: {
    initialLogs: [],
  },
  decorators: [fullscreenDecorator],
};

export const FewEntries: Story = {
  args: {
    initialLogs: generateSampleLogs(10),
  },
  decorators: [fullscreenDecorator],
};

export const ManyEntries: Story = {
  args: {
    initialLogs: generateSampleLogs(1000),
  },
  decorators: [fullscreenDecorator],
};

export const Streaming: Story = {
  args: {
    initialLogs: generateSampleLogs(50),
    streaming: true,
    streamInterval: 500,
  },
  decorators: [fullscreenDecorator],
};

export const ErrorHeavy: Story = {
  args: {
    initialLogs: generateSampleLogs(200).map((log, i) =>
      i % 3 === 0 ? { ...log, level: 'ERROR' as const } : log,
    ),
  },
  decorators: [fullscreenDecorator],
};

export const SingleService: Story = {
  args: {
    initialLogs: serviceLogs,
  },
  decorators: [fullscreenDecorator],
};

export const DenseWarnings: Story = {
  args: {
    initialLogs: denseWarnLogs,
  },
  decorators: [fullscreenDecorator],
};

export const CompactStream: Story = {
  args: {
    initialLogs: generateSampleLogs(40),
    streaming: true,
    streamInterval: 900,
  },
  decorators: [fixedFrameDecorator(780, 420)],
};

export const ReduxFilteredErrors: Story = {
  render: renderWithStore((store) => {
    store.dispatch(
      logViewerActions.replaceState(
        createLogViewerStateSeed({
          logs: generateSampleLogs(180),
          search: 'failed',
          levels: ['ERROR', 'FATAL'],
          autoScroll: false,
        }),
      ),
    );
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxSelectedEntry: Story = {
  render: renderWithStore((store) => {
    const seededLogs = generateSampleLogs(140);
    store.dispatch(
      logViewerActions.replaceState(
        createLogViewerStateSeed({
          logs: seededLogs,
          selectedId: seededLogs[seededLogs.length - 1]?.id ?? null,
          compactMode: true,
          wrapLines: true,
          serviceFilter: seededLogs[seededLogs.length - 1]?.service ?? 'All',
          autoScroll: false,
        }),
      ),
    );
  }),
  decorators: [fullscreenDecorator],
};

export const ReduxStreamingConsole: Story = {
  render: renderWithStore((store) => {
    store.dispatch(
      logViewerActions.replaceState(
        createLogViewerStateSeed({
          logs: denseWarnLogs,
          streaming: true,
          autoScroll: true,
        }),
      ),
    );
  }, 420),
  decorators: [fixedFrameDecorator(780, 420)],
};
