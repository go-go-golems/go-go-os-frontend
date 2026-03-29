import { formatAppKey, type LauncherRenderContext } from '@go-go-golems/os-shell';
import { todoLauncherModule } from './launcher/module';

const STANDALONE_INSTANCE_ID = 'standalone';
const STANDALONE_WINDOW_ID = `window:todo:${STANDALONE_INSTANCE_ID}`;

const standaloneRenderContext: LauncherRenderContext = {
  dispatch: () => undefined,
  getState: () => ({}),
  moduleId: todoLauncherModule.manifest.id,
  stateKey: todoLauncherModule.state?.stateKey,
};

export function App() {
  const appId = todoLauncherModule.manifest.id;
  const appKey = formatAppKey(appId, STANDALONE_INSTANCE_ID);

  return (
    todoLauncherModule.renderWindow({
      appId,
      appKey,
      instanceId: STANDALONE_INSTANCE_ID,
      windowId: STANDALONE_WINDOW_ID,
      ctx: standaloneRenderContext,
    }) ?? null
  );
}
