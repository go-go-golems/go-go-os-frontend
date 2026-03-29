import { PARTS } from '../../parts';

export interface RadioButtonProps {
  label: string;
  selected: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function RadioButton({ label, selected, onChange, disabled }: RadioButtonProps) {
  return (
    <div
      data-part={PARTS.radioButton}
      data-state={disabled ? 'disabled' : selected ? 'selected' : undefined}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onChange}
    >
      <div data-part={PARTS.radioButtonDot} />
      <span>{label}</span>
    </div>
  );
}
