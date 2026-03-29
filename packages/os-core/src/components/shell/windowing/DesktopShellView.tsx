import { PARTS } from '../../../parts';
import { HyperCardTheme } from '../../../theme/HyperCardTheme';
import { ContextMenu } from '../../widgets/ContextMenu';
import { Toast } from '../../widgets/Toast';
import { DesktopWindowMenuRuntimeProvider } from './desktopMenuRuntime';
import { DesktopIconLayer } from './DesktopIconLayer';
import { DesktopMenuBar } from './DesktopMenuBar';
import { WindowLayer } from './WindowLayer';
import type { DesktopShellControllerResult } from './useDesktopShellController';

export interface DesktopShellViewProps extends DesktopShellControllerResult {}

export function DesktopShellView({
  themeClass,
  menus,
  icons,
  activeMenuId,
  selectedIconId,
  windows,
  toast,
  onDesktopBackgroundClick,
  onActiveMenuChange,
  onCommand,
  onSelectIcon,
  onOpenIcon,
  onIconContextMenu,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
  onWindowContextMenu,
  renderWindowBody,
  contextMenu,
  onContextMenuClose,
  onContextMenuSelect,
  onContextMenuAction,
  openContextMenu,
  registerWindowMenuSections,
  unregisterWindowMenuSections,
  registerContextActions,
  unregisterContextActions,
  registerWindowContextActions,
  unregisterWindowContextActions,
  onContentMinSize,
  onToastDone,
}: DesktopShellViewProps) {
  return (
    <HyperCardTheme theme={themeClass}>
      <div data-part={PARTS.windowingDesktopShell} onClick={onDesktopBackgroundClick}>
        <DesktopMenuBar
          sections={menus}
          activeMenuId={activeMenuId}
          onActiveMenuChange={onActiveMenuChange}
          onCommand={(commandId, _menuId, invocation) => onCommand(commandId, invocation)}
        />
        <DesktopIconLayer
          icons={icons}
          selectedIconId={selectedIconId}
          onSelectIcon={onSelectIcon}
          onOpenIcon={onOpenIcon}
          onContextMenuIcon={onIconContextMenu}
        />
        <DesktopWindowMenuRuntimeProvider
          registerWindowMenuSections={registerWindowMenuSections}
          unregisterWindowMenuSections={unregisterWindowMenuSections}
          registerContextActions={registerContextActions}
          unregisterContextActions={unregisterContextActions}
          registerWindowContextActions={registerWindowContextActions}
          unregisterWindowContextActions={unregisterWindowContextActions}
          openContextMenu={openContextMenu}
        >
          <WindowLayer
            windows={windows}
            onFocusWindow={onFocusWindow}
            onCloseWindow={onCloseWindow}
            onWindowDragStart={onWindowDragStart}
            onWindowResizeStart={onWindowResizeStart}
            onWindowContextMenu={onWindowContextMenu}
            onContentMinSize={onContentMinSize}
            renderWindowBody={renderWindowBody}
          />
        </DesktopWindowMenuRuntimeProvider>
        {contextMenu ? (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onSelect={onContextMenuSelect}
            onAction={onContextMenuAction}
            onClose={onContextMenuClose}
          />
        ) : null}
        {toast && <Toast message={toast} onDone={onToastDone} />}
      </div>
    </HyperCardTheme>
  );
}
