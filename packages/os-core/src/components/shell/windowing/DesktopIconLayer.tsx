import type { MouseEvent } from 'react';
import { PARTS } from '../../../parts';
import type { DesktopIconDef } from './types';

export interface DesktopIconLayerProps {
  icons: DesktopIconDef[];
  selectedIconId: string | null;
  onSelectIcon?: (iconId: string) => void;
  onOpenIcon?: (iconId: string) => void;
  onContextMenuIcon?: (iconId: string, event: MouseEvent<HTMLButtonElement>) => void;
}

/** True when every icon has explicit x/y coordinates. */
function hasExplicitPositions(icons: DesktopIconDef[]): boolean {
  return icons.length > 0 && icons.every((i) => i.x != null && i.y != null);
}

function IconButton({
  icon,
  isSelected,
  onSelect,
  onOpen,
  onContextMenu,
}: {
  icon: DesktopIconDef;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-part={PARTS.windowingIcon}
      data-state={isSelected ? 'selected' : undefined}
      aria-pressed={isSelected}
      aria-label={icon.label}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span data-part={PARTS.windowingIconGlyph} aria-hidden="true">
        {icon.icon}
      </span>
      <span data-part={PARTS.windowingIconLabel}>{icon.label}</span>
    </button>
  );
}

export function DesktopIconLayer({
  icons,
  selectedIconId,
  onSelectIcon,
  onOpenIcon,
  onContextMenuIcon,
}: DesktopIconLayerProps) {
  const useAbsolute = hasExplicitPositions(icons);

  return (
    <ul
      data-part={PARTS.windowingIconLayer}
      data-layout={useAbsolute ? 'absolute' : 'grid'}
      aria-label="Desktop icons"
    >
      {icons.map((icon) => {
        const isSelected = selectedIconId === icon.id;

        if (useAbsolute) {
          return (
            <li key={icon.id} style={{ position: 'absolute', left: icon.x, top: icon.y }}>
              <IconButton
                icon={icon}
                isSelected={isSelected}
                onSelect={() => onSelectIcon?.(icon.id)}
                onOpen={() => onOpenIcon?.(icon.id)}
                onContextMenu={(event) => onContextMenuIcon?.(icon.id, event)}
              />
            </li>
          );
        }

        return (
          <li key={icon.id}>
            <IconButton
              icon={icon}
              isSelected={isSelected}
              onSelect={() => onSelectIcon?.(icon.id)}
              onOpen={() => onOpenIcon?.(icon.id)}
              onContextMenu={(event) => onContextMenuIcon?.(icon.id, event)}
            />
          </li>
        );
      })}
    </ul>
  );
}
