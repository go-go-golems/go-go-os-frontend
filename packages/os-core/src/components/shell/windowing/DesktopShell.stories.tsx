import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { type MouseEvent, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import type { RuntimeSurfaceMeta, RuntimeBundleDefinition } from '../../../cards/types';
import { windowingReducer } from '../../../desktop/core/state/windowingSlice';
import { notificationsReducer } from '../../../features/notifications/notificationsSlice';
import type { DesktopContribution } from './desktopContributions';
import { useOpenDesktopContextMenu, useRegisterWindowContextActions } from './desktopMenuRuntime';
import { DesktopShell, type DesktopShellProps } from './DesktopShell';
import type { DesktopActionEntry, DesktopIconDef } from './types';

function makeCard(id: string, title: string, icon: string, body: string): RuntimeSurfaceMeta {
  return {
    id,
    type: 'report',
    title,
    icon,
    ui: {
      t: 'text',
      value: body,
    },
  };
}

const DEMO_BUNDLE: RuntimeBundleDefinition = {
  id: 'desktop-shell-demo',
  name: 'Desktop Shell Demo',
  icon: '🖥️',
  homeSurface: 'home',
  surfaces: {
    home: makeCard('home', 'Home', '🏠', 'Welcome to the engine desktop shell story.'),
    dashboard: makeCard('dashboard', 'Dashboard', '📊', 'Dashboard card body.'),
    notes: makeCard('notes', 'Notes', '📝', 'Notes card body.'),
    tasks: makeCard('tasks', 'Tasks', '✅', 'Tasks card body.'),
  },
};

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'home', label: 'Home', icon: '🏠', kind: 'app' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', kind: 'app' },
  { id: 'notes', label: 'Notes', icon: '📝', kind: 'app' },
  { id: 'tasks', label: 'Tasks', icon: '✅', kind: 'app' },
  {
    id: 'folder.workspace',
    label: 'Workspace',
    icon: '🗂️',
    kind: 'folder',
    folder: {
      memberIconIds: ['dashboard', 'notes', 'tasks'],
    },
  },
];

function createStoryStore() {
  return configureStore({
    reducer: {
      windowing: windowingReducer,
      notifications: notificationsReducer,
    },
  });
}

function DesktopShellFrame(props: Partial<DesktopShellProps>) {
  const store = useMemo(() => createStoryStore(), []);

  return (
    <Provider store={store}>
      <div style={{ width: 980, height: 620 }}>
        <DesktopShell bundle={DEMO_BUNDLE} {...props} />
      </div>
    </Provider>
  );
}

const VISIBILITY_STORY_WINDOW_ID = 'window:story:tools';

function StoryToolsWindow() {
  const openDesktopContextMenu = useOpenDesktopContextMenu();
  const contextActions = useMemo<DesktopActionEntry[]>(
    () => [
      {
        id: 'story-tools-inspect',
        label: 'Inspect',
        commandId: 'story.tools.inspect',
      },
      {
        id: 'story-tools-admin-reset',
        label: 'Admin Reset',
        commandId: 'story.tools.admin-reset',
        visibility: {
          allowedRoles: ['admin'],
          unauthorized: 'disable',
        },
      },
    ],
    [],
  );
  useRegisterWindowContextActions(contextActions);

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    openDesktopContextMenu({
      target: {
        kind: 'window',
        windowId: VISIBILITY_STORY_WINDOW_ID,
      },
      position: { x: event.clientX, y: event.clientY },
    });
  };

  return (
    <section
      style={{
        height: '100%',
        display: 'grid',
        gap: 8,
        alignContent: 'start',
        padding: 12,
        background: '#fafafa',
      }}
      onContextMenu={onContextMenu}
    >
      <strong>Role-Aware Context Actions</strong>
      <span>Right-click this panel to open the window context menu.</span>
      <span>`Admin Reset` is disabled unless role resolves to `admin`.</span>
    </section>
  );
}

const VISIBILITY_STORY_CONTRIBUTIONS: DesktopContribution[] = [
  {
    id: 'story-tools-startup-window',
    startupWindows: [
      {
        id: VISIBILITY_STORY_WINDOW_ID,
        create: () => ({
          id: VISIBILITY_STORY_WINDOW_ID,
          title: 'Tools Window',
          icon: '🧪',
          bounds: { x: 520, y: 80, w: 380, h: 260 },
          content: {
            kind: 'app',
            appKey: 'story.tools:context',
          },
          dedupeKey: VISIBILITY_STORY_WINDOW_ID,
        }),
      },
    ],
  },
];

function VisibilityContextStory() {
  const [role, setRole] = useState<'viewer' | 'admin'>('viewer');

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        Role
        <select value={role} onChange={(event) => setRole(event.target.value as 'viewer' | 'admin')}>
          <option value="viewer">viewer</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <DesktopShellFrame
        contributions={VISIBILITY_STORY_CONTRIBUTIONS}
        renderAppWindow={(appKey) => (appKey === 'story.tools:context' ? <StoryToolsWindow /> : null)}
        visibilityContextResolver={({ target }) => ({ target, roles: [role] })}
      />
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/DesktopShell',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <DesktopShellFrame />,
};

export const WithDesktopFolders: Story = {
  render: () => <DesktopShellFrame icons={DESKTOP_ICONS} />,
};

export const WithRoleAwareVisibilityContext: Story = {
  render: () => <VisibilityContextStory />,
};
