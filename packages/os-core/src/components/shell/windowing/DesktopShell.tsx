import { DesktopShellView } from './DesktopShellView';
import type { DesktopShellProps } from './desktopShellTypes';
import { useDesktopShellController } from './useDesktopShellController';

export type { DesktopShellProps } from './desktopShellTypes';

export function DesktopShell(props: DesktopShellProps) {
  const controller = useDesktopShellController(props);
  return <DesktopShellView {...controller} />;
}
