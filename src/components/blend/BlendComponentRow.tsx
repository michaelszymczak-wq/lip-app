import { X } from 'lucide-react';
import type { Lot } from '../../api/innovint';
import type { BlendComponent } from '../../blend/types';
import { LotPicker } from './LotPicker';

interface Props {
  component: BlendComponent;
  lots: Lot[];
  inputMode: 'volume' | 'percent';
  onUpdate: (partial: Partial<BlendComponent>) => void;
  onRemove: () => void;
}

export function BlendComponentRow({
  component,
  lots,
  inputMode,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <LotPicker
        lots={lots}
        selectedLotId={component.lotId}
        onSelect={(id, code) => onUpdate({ lotId: id, lotCode: code })}
      />

      {inputMode === 'volume' ? (
        <div className="flex items-center gap-1 w-36 shrink-0">
          <input
            type="number"
            min={0}
            step={1}
            value={component.litres || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdate({ litres: isNaN(val) ? 0 : val });
            }}
            placeholder="0"
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-xs text-slate-500 shrink-0">L</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 w-36 shrink-0">
          <input
            type="number"
            min={0}
            step="any"
            value={component.percent ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdate({ percent: isNaN(val) ? undefined : val });
            }}
            placeholder="0"
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-xs text-slate-500 shrink-0">%</span>
        </div>
      )}

      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-0.5"
        title="Remove"
      >
        <X size={15} />
      </button>
    </div>
  );
}
