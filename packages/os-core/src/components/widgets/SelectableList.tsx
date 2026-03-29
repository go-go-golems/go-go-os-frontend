import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { PARTS } from '../../parts';

export interface SelectableListItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  meta?: string;
  keywords?: string[];
  disabled?: boolean;
}

export type SelectableListInputItem = string | SelectableListItem;
export type SelectableListSelectionMode = 'single' | 'multiple';

export interface SelectableListProps {
  items: SelectableListInputItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  mode?: SelectableListSelectionMode;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchText?: string;
  onSearchTextChange?: (value: string) => void;
  onSubmit?: (selectedIds: string[]) => void;
  height?: number | string;
  width?: number | string;
  emptyMessage?: string;
}

export function normalizeSelectableListItems(items: SelectableListInputItem[]): SelectableListItem[] {
  return items.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `item-${index}-${item}`,
        label: item,
      };
    }
    return item;
  });
}

export function nextSelection(
  current: string[],
  id: string,
  mode: SelectableListSelectionMode,
  disabled?: boolean,
): string[] {
  if (disabled) {
    return current;
  }
  if (mode === 'single') {
    return [id];
  }
  return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
}

function itemMatchesSearch(item: SelectableListItem, normalizedSearch: string): boolean {
  if (!normalizedSearch) {
    return true;
  }
  const haystacks = [item.label, item.description ?? '', item.meta ?? '', ...(item.keywords ?? [])]
    .join(' ')
    .toLowerCase();
  return haystacks.includes(normalizedSearch);
}

export function SelectableList({
  items,
  selectedIds,
  onSelectionChange,
  mode = 'single',
  searchable,
  searchPlaceholder,
  searchText,
  onSearchTextChange,
  onSubmit,
  height = 120,
  width = '100%',
  emptyMessage,
}: SelectableListProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const resolvedSearch = searchText ?? internalSearch;
  const normalizedSearch = resolvedSearch.trim().toLowerCase();

  const normalizedItems = useMemo(() => normalizeSelectableListItems(items), [items]);
  const visibleItems = useMemo(
    () => normalizedItems.filter((item) => itemMatchesSearch(item, normalizedSearch)),
    [normalizedItems, normalizedSearch],
  );

  const style: CSSProperties = { height, width };

  const setSearch = (value: string) => {
    onSearchTextChange?.(value);
    if (onSearchTextChange === undefined) {
      setInternalSearch(value);
    }
    setActiveIndex(0);
  };

  const handlePick = (item: SelectableListItem) => {
    onSelectionChange(nextSelection(selectedIds, item.id, mode, item.disabled));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (visibleItems.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, visibleItems.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeItem = visibleItems[activeIndex];
      if (!activeItem) {
        return;
      }
      const next = nextSelection(selectedIds, activeItem.id, mode, activeItem.disabled);
      onSelectionChange(next);
      if (event.key === 'Enter') {
        onSubmit?.(next);
      }
    }
  };

  return (
    <div data-part={PARTS.confirmWidgetBody}>
      {searchable && (
        <input
          data-part={PARTS.fieldInput}
          type="text"
          value={resolvedSearch}
          placeholder={searchPlaceholder ?? 'Search...'}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}

      <div
        data-part={PARTS.listBox}
        role="listbox"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={style}
        aria-multiselectable={mode === 'multiple' ? true : undefined}
      >
        {visibleItems.length === 0 && <div data-part={PARTS.tableEmpty}>{emptyMessage ?? 'No matching options'}</div>}
        {visibleItems.map((item, index) => {
          const selected = selectedIds.includes(item.id);
          const active = index === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              data-part={PARTS.listBoxItem}
              data-state={selected ? 'selected' : active ? 'active' : undefined}
              role="option"
              aria-selected={selected}
              disabled={item.disabled}
              onClick={() => handlePick(item)}
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: item.icon ? 'auto 1fr auto' : '1fr auto',
                gap: 6,
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>
                <span>{item.label}</span>
                {item.description && (
                  <span data-part={PARTS.confirmProgress} style={{ display: 'block' }}>
                    {item.description}
                  </span>
                )}
              </span>
              {item.meta && <span data-part={PARTS.chip}>{item.meta}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
