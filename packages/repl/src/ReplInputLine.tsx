import type { ReplCompletionItem } from './types';
import { REPL_PARTS as P } from './parts';

export function ReplInputLine({
  prompt,
  input,
  suggestion,
  showCompletion,
  completions,
  completionIdx,
  disabled = false,
  inputRef,
  onChange,
  onKeyDown,
  onPickCompletion,
}: {
  prompt: string;
  input: string;
  suggestion: string;
  showCompletion: boolean;
  completions: ReplCompletionItem[];
  completionIdx: number;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPickCompletion: (completion: ReplCompletionItem) => void;
}) {
  return (
    <div data-part={P.replInputLine}>
      <span data-part={P.replPrompt}>{prompt}</span>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          data-part={P.replInput}
          type="text"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
        {suggestion && (
          <span data-part={P.replGhost} style={{ left: `${input.length * 7.2}px` }}>
            {suggestion}
          </span>
        )}
        {showCompletion && completions.length > 1 && (
          <div data-part={P.replCompletionPopup}>
            {completions.map((completion, index) => (
              <div
                key={completion.value}
                data-part={P.replCompletionItem}
                data-state={index === completionIdx ? 'active' : undefined}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPickCompletion(completion);
                  inputRef.current?.focus();
                }}
              >
                <span>{completion.value}</span>
                <span style={{ opacity: 0.5, marginLeft: 8 }}>
                  {(completion.detail ?? 'item').slice(0, 30)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
