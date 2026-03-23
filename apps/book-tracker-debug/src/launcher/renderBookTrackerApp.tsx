import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from '../domain/stack';

export function BookTrackerRealAppWindow() {
  return <DesktopShell bundle={STACK} />;
}
