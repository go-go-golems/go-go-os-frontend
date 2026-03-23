import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from '../domain/stack';

export function CrmRealAppWindow() {
  return <DesktopShell bundle={STACK} />;
}
