import type { MouseEvent } from 'react';
import type { DesktopIconDef } from './types';
export interface DesktopIconLayerProps {
    icons: DesktopIconDef[];
    selectedIconId: string | null;
    onSelectIcon?: (iconId: string) => void;
    onOpenIcon?: (iconId: string) => void;
    onContextMenuIcon?: (iconId: string, event: MouseEvent<HTMLButtonElement>) => void;
}
export declare function DesktopIconLayer({ icons, selectedIconId, onSelectIcon, onOpenIcon, onContextMenuIcon, }: DesktopIconLayerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DesktopIconLayer.d.ts.map