import { PARTS } from '../../parts';

export type RatingStyle = 'numbers' | 'stars' | 'emoji' | 'slider';

export interface RatingPickerProps {
  scale?: number;
  style?: RatingStyle;
  value?: number;
  disabled?: boolean;
  lowLabel?: string;
  highLabel?: string;
  onChange?: (value: number) => void;
}

const EMOJI_SCALE = ['😡', '😞', '😐', '🙂', '😄', '🤩', '🔥', '🚀', '🌟', '🏆'];

function clampScale(scale?: number): number {
  if (typeof scale !== 'number' || !Number.isFinite(scale)) {
    return 5;
  }
  return Math.max(2, Math.min(10, Math.round(scale)));
}

function clampValue(value: number, scale: number): number {
  return Math.max(1, Math.min(scale, Math.round(value)));
}

function renderRatingLabel(index: number, style: RatingStyle): string {
  switch (style) {
    case 'stars':
      return '★'.repeat(index);
    case 'emoji':
      return EMOJI_SCALE[index - 1] ?? String(index);
    case 'slider':
    case 'numbers':
    default:
      return String(index);
  }
}

export function RatingPicker({
  scale = 5,
  style = 'numbers',
  value = 3,
  disabled,
  lowLabel,
  highLabel,
  onChange,
}: RatingPickerProps) {
  const normalizedScale = clampScale(scale);
  const normalizedValue = clampValue(value, normalizedScale);

  if (style === 'slider') {
    return (
      <div data-part={PARTS.confirmWidgetBody}>
        {(lowLabel || highLabel) && (
          <div data-part={PARTS.confirmRatingLabels}>
            <span>{lowLabel ?? ''}</span>
            <span>{normalizedValue}/{normalizedScale}</span>
            <span>{highLabel ?? ''}</span>
          </div>
        )}
        <input
          data-part={PARTS.fieldInput}
          type="range"
          min={1}
          max={normalizedScale}
          value={normalizedValue}
          disabled={disabled}
          onChange={(event) => onChange?.(clampValue(Number(event.target.value), normalizedScale))}
        />
      </div>
    );
  }

  return (
    <div data-part={PARTS.confirmWidgetBody}>
      {(lowLabel || highLabel) && (
        <div data-part={PARTS.confirmRatingLabels}>
          <span>{lowLabel ?? ''}</span>
          <span>{highLabel ?? ''}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: normalizedScale }).map((_, idx) => {
          const rating = idx + 1;
          return (
            <button
              key={rating}
              type="button"
              data-part={PARTS.confirmRatingOption}
              data-state={rating === normalizedValue ? 'active' : undefined}
              disabled={disabled}
              onClick={() => onChange?.(rating)}
            >
              {renderRatingLabel(rating, style)}
            </button>
          );
        })}
      </div>
      <div data-part={PARTS.confirmProgress}>Selected: {normalizedValue}</div>
    </div>
  );
}
