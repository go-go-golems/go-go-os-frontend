import { PARTS } from '../../parts';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  return (
    <div
      data-part={PARTS.checkbox}
      data-state={disabled ? 'disabled' : checked ? 'checked' : undefined}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onChange}
    >
      <div data-part={PARTS.checkboxMark}>{checked ? '✕' : ''}</div>
      <span>{label}</span>
    </div>
  );
}
