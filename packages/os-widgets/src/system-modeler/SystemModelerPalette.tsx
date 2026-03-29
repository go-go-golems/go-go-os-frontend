import { RICH_PARTS as P } from '../parts';
import type { BlockTypeDef } from './types';

export function PaletteSection({
  title,
  blocks,
  onAdd,
}: {
  title: string;
  blocks: BlockTypeDef[];
  onAdd: (blockType: BlockTypeDef) => void;
}) {
  return (
    <>
      <div data-part={P.smPaletteSectionTitle}>{title}</div>
      {blocks.map((blockType) => (
        <div
          key={blockType.type}
          data-part={P.smPaletteItem}
          onClick={() => onAdd(blockType)}
        >
          <span data-part={P.smPaletteItemIcon}>{blockType.emoji}</span>
          {blockType.label}
        </div>
      ))}
    </>
  );
}
