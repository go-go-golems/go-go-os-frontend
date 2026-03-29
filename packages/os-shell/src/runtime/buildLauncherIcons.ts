import type { DesktopIconDef } from '@go-go-golems/os-core/desktop-react';
import type { AppRegistry } from '../registry/createAppRegistry';

export interface LauncherFolderIconOptions {
  id?: string;
  label?: string;
  icon?: string;
  x?: number;
  y?: number;
  memberIconIds?: string[];
}

export interface BuildLauncherIconsOptions {
  folder?: LauncherFolderIconOptions | false;
}

const DEFAULT_FOLDER_ICON: Required<Pick<LauncherFolderIconOptions, 'id' | 'label' | 'icon'>> = {
  id: 'launcher.apps.folder',
  label: 'Applications',
  icon: '🗂️',
};

function normalizeFolderMemberIds(memberIconIds: string[] | undefined, availableIconIds: Set<string>): string[] {
  const source = memberIconIds ?? Array.from(availableIconIds);
  const members: string[] = [];
  const seen = new Set<string>();
  for (const rawMemberId of source) {
    const memberId = String(rawMemberId ?? '').trim();
    if (!memberId || seen.has(memberId) || !availableIconIds.has(memberId)) {
      continue;
    }
    seen.add(memberId);
    members.push(memberId);
  }
  return members;
}

export function buildLauncherIcons(registry: AppRegistry, options: BuildLauncherIconsOptions = {}): DesktopIconDef[] {
  const byId = new Set<string>();
  const icons: DesktopIconDef[] = [];

  for (const module of registry.list()) {
    const iconId = module.manifest.desktop?.id ?? module.manifest.id;
    if (byId.has(iconId)) {
      throw new Error(`Duplicate launcher icon id "${iconId}".`);
    }
    byId.add(iconId);
    icons.push({
      id: iconId,
      label: module.manifest.name,
      icon: module.manifest.icon,
      kind: 'app',
      appId: module.manifest.id,
      x: module.manifest.desktop?.x,
      y: module.manifest.desktop?.y,
    });
  }

  if (options.folder !== false) {
    const folderConfig = options.folder ?? {};
    const folderId = String(folderConfig.id ?? DEFAULT_FOLDER_ICON.id).trim();
    if (folderId.length === 0) {
      throw new Error('Launcher folder icon id cannot be blank.');
    }
    if (byId.has(folderId)) {
      throw new Error(`Launcher folder icon id "${folderId}" collides with an app icon id.`);
    }

    const memberIconIds = normalizeFolderMemberIds(folderConfig.memberIconIds, byId);
    if (memberIconIds.length > 0) {
      byId.add(folderId);
      icons.push({
        id: folderId,
        label: String(folderConfig.label ?? DEFAULT_FOLDER_ICON.label).trim() || DEFAULT_FOLDER_ICON.label,
        icon: String(folderConfig.icon ?? DEFAULT_FOLDER_ICON.icon).trim() || DEFAULT_FOLDER_ICON.icon,
        kind: 'folder',
        folder: {
          memberIconIds,
        },
        x: folderConfig.x,
        y: folderConfig.y,
      });
    }
  }

  return icons;
}
