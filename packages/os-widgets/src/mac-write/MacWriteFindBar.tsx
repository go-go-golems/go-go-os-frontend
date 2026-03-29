import { Btn } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';

export function MacWriteFindBar({
  findQuery,
  replaceQuery,
  matchCount,
  onFindQueryChange,
  onReplaceQueryChange,
  onReplace,
  onReplaceAll,
  onClose,
}: {
  findQuery: string;
  replaceQuery: string;
  matchCount: number;
  onFindQueryChange: (value: string) => void;
  onReplaceQueryChange: (value: string) => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}) {
  return (
    <div data-part={P.mwFindBar}>
      <span style={{ fontSize: 12 }}>🔍</span>
      <input
        data-part="field-input"
        value={findQuery}
        onChange={(event) => onFindQueryChange(event.target.value)}
        placeholder="Find..."
        style={{ width: 140 }}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      />
      <input
        data-part="field-input"
        value={replaceQuery}
        onChange={(event) => onReplaceQueryChange(event.target.value)}
        placeholder="Replace..."
        style={{ width: 140 }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      />
      <Btn onClick={onReplace} style={{ fontSize: 9 }}>
        Replace
      </Btn>
      <Btn onClick={onReplaceAll} style={{ fontSize: 9 }}>
        All
      </Btn>
      <span style={{ fontSize: 9, opacity: 0.6 }}>
        {matchCount > 0 ? `${matchCount} found` : findQuery ? 'No matches' : ''}
      </span>
      <div style={{ marginLeft: 'auto' }}>
        <Btn onClick={onClose} style={{ fontSize: 9 }}>
          ✕
        </Btn>
      </div>
    </div>
  );
}
