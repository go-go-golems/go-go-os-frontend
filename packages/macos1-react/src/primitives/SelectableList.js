import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { PARTS } from '../parts/parts';
export function normalizeSelectableListItems(items) {
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
export function nextSelection(current, id, mode, disabled) {
    if (disabled) {
        return current;
    }
    if (mode === 'single') {
        return [id];
    }
    return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
}
function itemMatchesSearch(item, normalizedSearch) {
    if (!normalizedSearch) {
        return true;
    }
    const haystacks = [item.label, item.description ?? '', item.meta ?? '', ...(item.keywords ?? [])]
        .join(' ')
        .toLowerCase();
    return haystacks.includes(normalizedSearch);
}
export function SelectableList({ items, selectedIds, onSelectionChange, mode = 'single', searchable, searchPlaceholder, searchText, onSearchTextChange, onSubmit, height = 120, width = '100%', emptyMessage, }) {
    const [internalSearch, setInternalSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const resolvedSearch = searchText ?? internalSearch;
    const normalizedSearch = resolvedSearch.trim().toLowerCase();
    const normalizedItems = useMemo(() => normalizeSelectableListItems(items), [items]);
    const visibleItems = useMemo(() => normalizedItems.filter((item) => itemMatchesSearch(item, normalizedSearch)), [normalizedItems, normalizedSearch]);
    const style = { height, width };
    const setSearch = (value) => {
        onSearchTextChange?.(value);
        if (onSearchTextChange === undefined) {
            setInternalSearch(value);
        }
        setActiveIndex(0);
    };
    const handlePick = (item) => {
        onSelectionChange(nextSelection(selectedIds, item.id, mode, item.disabled));
    };
    const handleKeyDown = (event) => {
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
    return (_jsxs("div", { "data-part": PARTS.confirmWidgetBody, children: [searchable && (_jsx("input", { "data-part": PARTS.fieldInput, type: "text", value: resolvedSearch, placeholder: searchPlaceholder ?? 'Search...', onChange: (event) => setSearch(event.target.value) })), _jsxs("div", { "data-part": PARTS.listBox, role: "listbox", tabIndex: 0, onKeyDown: handleKeyDown, style: style, "aria-multiselectable": mode === 'multiple' ? true : undefined, children: [visibleItems.length === 0 && _jsx("div", { "data-part": PARTS.tableEmpty, children: emptyMessage ?? 'No matching options' }), visibleItems.map((item, index) => {
                        const selected = selectedIds.includes(item.id);
                        const active = index === activeIndex;
                        return (_jsxs("button", { type: "button", "data-part": PARTS.listBoxItem, "data-state": selected ? 'selected' : active ? 'active' : undefined, role: "option", "aria-selected": selected, disabled: item.disabled, onClick: () => handlePick(item), style: {
                                width: '100%',
                                textAlign: 'left',
                                display: 'grid',
                                gridTemplateColumns: item.icon ? 'auto 1fr auto' : '1fr auto',
                                gap: 6,
                            }, children: [item.icon && _jsx("span", { children: item.icon }), _jsxs("span", { children: [_jsx("span", { children: item.label }), item.description && (_jsx("span", { "data-part": PARTS.confirmProgress, style: { display: 'block' }, children: item.description }))] }), item.meta && _jsx("span", { "data-part": PARTS.chip, children: item.meta })] }, item.id));
                    })] })] }));
}
//# sourceMappingURL=SelectableList.js.map