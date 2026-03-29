import { RICH_PARTS as P } from '../parts';

export interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: LabeledSliderProps) {
  return (
    <div data-part={P.labeledSlider}>
      <span data-part={P.labeledSliderLabel}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span data-part={P.labeledSliderValue}>
        {value}
        {unit || ''}
      </span>
    </div>
  );
}
