import { PARTS } from '../../parts';

export type ImageChoiceMode = 'select' | 'confirm' | 'multi';

export interface ImageChoiceItem {
  id: string;
  src: string;
  alt?: string;
  label?: string;
  badge?: string;
  disabled?: boolean;
}

export interface ImageChoiceGridProps {
  items: ImageChoiceItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  mode?: ImageChoiceMode;
  columns?: number;
  loading?: boolean;
  errorMessage?: string;
}

function nextImageSelection(current: string[], id: string, mode: ImageChoiceMode): string[] {
  if (mode === 'multi') {
    return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
  }
  return [id];
}

export function ImageChoiceGrid({
  items,
  selectedIds,
  onSelectionChange,
  mode = 'select',
  columns = 3,
  loading,
  errorMessage,
}: ImageChoiceGridProps) {
  if (loading) {
    return <div data-part={PARTS.tableEmpty}>Loading images...</div>;
  }

  if (errorMessage) {
    return <div data-part={PARTS.tableEmpty}>{errorMessage}</div>;
  }

  if (items.length === 0) {
    return <div data-part={PARTS.tableEmpty}>No images available</div>;
  }

  return (
    <div
      data-part={PARTS.confirmWidgetBody}
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            data-part={PARTS.confirmImageCard}
            data-state={selected ? 'selected' : undefined}
            onClick={() => onSelectionChange(nextImageSelection(selectedIds, item.id, mode))}
          >
            <img
              src={item.src}
              alt={item.alt ?? item.label ?? item.id}
            />
            <span data-part={PARTS.confirmProgress}>{item.label ?? item.id}</span>
            {item.badge && <span data-part={PARTS.chip}>{item.badge}</span>}
            {mode === 'confirm' && selected && <span data-part={PARTS.fieldValue}>Selected for confirmation</span>}
          </button>
        );
      })}
    </div>
  );
}
