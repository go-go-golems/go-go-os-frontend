import { DesktopShell } from '@go-go-golems/os-core/desktop-react';
import { STACK } from '../domain/stack';

export function CrmRealAppWindow() {
  return <DesktopShell bundle={STACK} />;
}
