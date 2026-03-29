import { DesktopShell } from '@go-go-golems/os-core/desktop-react';
import { STACK } from '../domain/stack';

export function TodoRealAppWindow() {
  return <DesktopShell bundle={STACK} />;
}
