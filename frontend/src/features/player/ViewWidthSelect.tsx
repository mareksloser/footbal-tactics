import { VIEW_WIDTH_OPTIONS, type ViewWidth } from './viewWidth';

export function ViewWidthSelect({value, onChange,}: {
    value: ViewWidth;
    onChange: (value: ViewWidth) => void;
}) {
    return (
        <label className="hidden lg:block">
      <span className="mb-1.5  text-[11px] font-extrabold tracking-[0.18em] text-muted uppercase hidden">
        Zobrazení
      </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value as ViewWidth)}
                className="w-52 rounded-lg border border-edge bg-panel px-3 py-2 text-sm"
            >
                {VIEW_WIDTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}