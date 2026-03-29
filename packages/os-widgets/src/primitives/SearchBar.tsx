import { RICH_PARTS as P } from '../parts';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  count?: number;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  count,
  className,
}: SearchBarProps) {
  return (
    <div data-part={P.widgetSearchBar} className={className}>
      <span data-part={P.widgetSearchIcon}>🔍</span>
      <input
        data-part={P.widgetSearchInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {count !== undefined && (
        <span data-part={P.widgetSearchCount}>{count} results</span>
      )}
    </div>
  );
}
