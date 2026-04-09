import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PARTS } from '../parts/parts';
const EMOJI_SCALE = ['😡', '😞', '😐', '🙂', '😄', '🤩', '🔥', '🚀', '🌟', '🏆'];
function clampScale(scale) {
    if (typeof scale !== 'number' || !Number.isFinite(scale)) {
        return 5;
    }
    return Math.max(2, Math.min(10, Math.round(scale)));
}
function clampValue(value, scale) {
    return Math.max(1, Math.min(scale, Math.round(value)));
}
function renderRatingLabel(index, style) {
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
export function RatingPicker({ scale = 5, style = 'numbers', value = 3, disabled, lowLabel, highLabel, onChange, }) {
    const normalizedScale = clampScale(scale);
    const normalizedValue = clampValue(value, normalizedScale);
    if (style === 'slider') {
        return (_jsxs("div", { "data-part": PARTS.confirmWidgetBody, children: [(lowLabel || highLabel) && (_jsxs("div", { "data-part": PARTS.confirmRatingLabels, children: [_jsx("span", { children: lowLabel ?? '' }), _jsxs("span", { children: [normalizedValue, "/", normalizedScale] }), _jsx("span", { children: highLabel ?? '' })] })), _jsx("input", { "data-part": PARTS.fieldInput, type: "range", min: 1, max: normalizedScale, value: normalizedValue, disabled: disabled, onChange: (event) => onChange?.(clampValue(Number(event.target.value), normalizedScale)) })] }));
    }
    return (_jsxs("div", { "data-part": PARTS.confirmWidgetBody, children: [(lowLabel || highLabel) && (_jsxs("div", { "data-part": PARTS.confirmRatingLabels, children: [_jsx("span", { children: lowLabel ?? '' }), _jsx("span", { children: highLabel ?? '' })] })), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 }, children: Array.from({ length: normalizedScale }).map((_, idx) => {
                    const rating = idx + 1;
                    return (_jsx("button", { type: "button", "data-part": PARTS.confirmRatingOption, "data-state": rating === normalizedValue ? 'active' : undefined, disabled: disabled, onClick: () => onChange?.(rating), children: renderRatingLabel(rating, style) }, rating));
                }) }), _jsxs("div", { "data-part": PARTS.confirmProgress, children: ["Selected: ", normalizedValue] })] }));
}
//# sourceMappingURL=RatingPicker.js.map