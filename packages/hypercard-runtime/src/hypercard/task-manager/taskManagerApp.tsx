import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { TaskManagerWindow } from './TaskManagerWindow';

export const HYPERCARD_TASK_MANAGER_APP_ID = 'hypercard-task-manager';
export const HYPERCARD_TASK_MANAGER_INSTANCE_ID = 'tasks';

export interface BuildTaskManagerWindowPayloadOptions {
  appId?: string;
  instanceId?: string;
  title?: string;
  icon?: string;
  bounds?: OpenWindowPayload['bounds'];
  dedupeKey?: string;
}

export interface TaskManagerAppWindowProps {
  instanceId: string;
}

export function buildTaskManagerWindowPayload(
  options: BuildTaskManagerWindowPayloadOptions = {},
): OpenWindowPayload {
  const appId = options.appId ?? HYPERCARD_TASK_MANAGER_APP_ID;
  const instanceId = options.instanceId ?? HYPERCARD_TASK_MANAGER_INSTANCE_ID;
  return {
    id: `window:${appId}:${instanceId}`,
    title: options.title ?? 'Task Manager',
    icon: options.icon ?? '🗂️',
    bounds: options.bounds ?? { x: 120, y: 52, w: 860, h: 520 },
    content: {
      kind: 'app',
      appKey: `${appId}:${instanceId}`,
    },
    dedupeKey: options.dedupeKey ?? `${appId}:${instanceId}`,
  };
}

export function TaskManagerAppWindow({ instanceId }: TaskManagerAppWindowProps) {
  if (instanceId !== HYPERCARD_TASK_MANAGER_INSTANCE_ID) {
    return (
      <section style={{ padding: 12, display: 'grid', gap: 8 }}>
        <strong>Task Manager</strong>
        <span>Unknown task manager window instance: {instanceId}</span>
      </section>
    );
  }

  return <TaskManagerWindow />;
}
