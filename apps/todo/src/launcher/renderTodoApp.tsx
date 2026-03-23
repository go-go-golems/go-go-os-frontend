import { DesktopShell } from '@hypercard/engine/desktop-react';
import { STACK } from '../domain/stack';

export function TodoRealAppWindow() {
  return <DesktopShell bundle={STACK} />;
}
