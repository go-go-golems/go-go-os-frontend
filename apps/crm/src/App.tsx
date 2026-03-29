import { formatAppKey, type LauncherRenderContext } from '@go-go-golems/os-shell';
import { crmLauncherModule } from './launcher/module';

const STANDALONE_INSTANCE_ID = 'standalone';
const STANDALONE_WINDOW_ID = `window:crm:${STANDALONE_INSTANCE_ID}`;

const standaloneRenderContext: LauncherRenderContext = {
  dispatch: () => undefined,
  getState: () => ({}),
  moduleId: crmLauncherModule.manifest.id,
  stateKey: crmLauncherModule.state?.stateKey,
};

export function App() {
  const appId = crmLauncherModule.manifest.id;
  const appKey = formatAppKey(appId, STANDALONE_INSTANCE_ID);

  return (
    crmLauncherModule.renderWindow({
      appId,
      appKey,
      instanceId: STANDALONE_INSTANCE_ID,
      windowId: STANDALONE_WINDOW_ID,
      ctx: standaloneRenderContext,
    }) ?? null
  );
}
