'use client';

/* Form selector. Renders nothing at all when the entity may file only one
   ITR, so those forms get the full page height with zero chrome. */
import { ITR_META, type ItrKey } from '../lib/itrForms';

interface Props {
  forms: ItrKey[];
  active: ItrKey;
  onSelect: (key: ItrKey) => void;
}

export function ItrTabs({ forms, active, onSelect }: Props) {
  if (forms.length < 2) return null;
  return (
    <div className="flex items-center gap-1 px-2 h-8 bg-slate-100 border-b border-slate-200" role="tablist">
      {forms.map((k) => {
        const on = k === active;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(k)}
            title={ITR_META[k].note}
            className={`h-6 px-3 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              on ? 'bg-white text-slate-900 shadow-sm'
                 : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            {ITR_META[k].label}
          </button>
        );
      })}
    </div>
  );
}
