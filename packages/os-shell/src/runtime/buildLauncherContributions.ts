import type {
  DesktopCommandContext,
  DesktopCommandHandler,
  DesktopContribution,
} from '@go-go-golems/os-core/desktop-react';
import type { LaunchReason } from '../contracts/appManifest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';
import type { LauncherHostContext } from '../contracts/launcherHostContext';
import type { AppRegistry } from '../registry/createAppRegistry';
import { buildLauncherIcons, type LauncherFolderIconOptions } from './buildLauncherIcons';

export interface BuildLauncherContributionsOptions {
  hostContext: LauncherHostContext;
  iconContributionId?: string;
  folderIcon?: LauncherFolderIconOptions | false;
}

function createLaunchCommandHandler(
  module: LaunchableAppModule,
  iconId: string,
  hostContext: LauncherHostContext,
): DesktopCommandHandler {
  const launchReasonByCommand = new Map<string, LaunchReason>([
    [`icon.open.${iconId}`, 'icon'],
    [`app.launch.${module.manifest.id}`, 'command'],
  ]);

  return {
    id: `launcher.launch.${module.manifest.id}`,
    priority: 200,
    matches: (commandId: string) => launchReasonByCommand.has(commandId),
    run: (commandId: string, _ctx: DesktopCommandContext) => {
      const launchReason = launchReasonByCommand.get(commandId);
      if (!launchReason) {
        return 'pass';
      }
      const payload = module.buildLaunchWindow(hostContext, launchReason);
      hostContext.openWindow(payload);
      return 'handled';
    },
  };
}

export function buildLauncherContributions(
  registry: AppRegistry,
  options: BuildLauncherContributionsOptions,
): DesktopContribution[] {
  const moduleContributions = registry
    .list()
    .flatMap((module) => (module.createContributions ? module.createContributions(options.hostContext) : []));

  const launchCommands = registry.list().map((module) => {
    const iconId = module.manifest.desktop?.id ?? module.manifest.id;
    return createLaunchCommandHandler(module, iconId, options.hostContext);
  });

  return [
    ...moduleContributions,
    {
      id: options.iconContributionId ?? 'launcher.apps',
      icons: buildLauncherIcons(registry, {
        folder: options.folderIcon,
      }),
      commands: launchCommands,
    },
  ];
}
