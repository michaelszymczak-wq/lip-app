import { Plus, Loader2, FlaskConical } from 'lucide-react';
import type { Lot } from '../../api/innovint';
import type { BlendTrial, BlendComponent } from '../../blend/types';
import { BlendComponentRow } from './BlendComponentRow';

interface Props {
  trial: BlendTrial;
  lots: Lot[];
  inputMode: 'volume' | 'percent';
  isCalculating: boolean;
  onUpdateTrial: (updated: BlendTrial) => void;
  onInputModeChange: (mode: 'volume' | 'percent') => void;
  onCalculate: () => void;
}

export function BlendEditor({
  trial,
  lots,
  inputMode,
  isCalculating,
  onUpdateTrial,
  onInputModeChange,
  onCalculate,
}: Props) {
  const totalLitres = trial.components.reduce((sum, c) => sum + c.litres, 0);
  const targetLitres = trial.targetLitres ?? 0;

  // Percent mode: running total and delta shown to the user
  const totalPct = trial.components.reduce((sum, c) => sum + (c.percent ?? 0), 0);
  const deltaPct = 100 - totalPct;

  function updateComponent(index: number, partial: Partial<BlendComponent>) {
    const updated = trial.components.map((c, i) => (i === index ? { ...c, ...partial } : c));
    onUpdateTrial({ ...trial, components: updated });
  }

  function removeComponent(index: number) {
    const updated = trial.components.filter((_, i) => i !== index);
    onUpdateTrial({ ...trial, components: updated });
  }

  function addComponent() {
    const newComponent: BlendComponent = { lotId: '', lotCode: '', litres: 0 };
    onUpdateTrial({ ...trial, components: [...trial.components, newComponent] });
  }

  const canCalculate = inputMode === 'volume'
    ? trial.components.some((c) => c.lotId && c.litres > 0)
    : trial.components.some((c) => c.lotId && (c.percent ?? 0) > 0);

  return (
    <div className="space-y-4">
      {/* Trial name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Trial Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={trial.name}
          onChange={(e) => onUpdateTrial({ ...trial, name: e.target.value })}
          placeholder="Enter trial name…"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            trial.name.trim() === ''
              ? 'border-red-300 bg-red-50'
              : 'border-slate-300 bg-white'
          }`}
        />
        {trial.name.trim() === '' && (
          <p className="text-xs text-red-500 mt-0.5">Required before generating reports</p>
        )}
      </div>

      {/* Input mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => onInputModeChange('volume')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              inputMode === 'volume'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Volume (L)
          </button>
          <button
            onClick={() => onInputModeChange('percent')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              inputMode === 'percent'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Percent (%)
          </button>
        </div>

        {inputMode === 'volume' && totalLitres > 0 && (
          <span className="text-xs text-slate-500">
            Total: <strong className="text-slate-800">{totalLitres.toLocaleString()} L</strong>
          </span>
        )}

        {inputMode === 'percent' && totalPct > 0 && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            Math.abs(deltaPct) < 0.01
              ? 'bg-green-100 text-green-800'
              : deltaPct > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {totalPct.toFixed(2)}%
            {Math.abs(deltaPct) >= 0.01 && (
              <> {deltaPct > 0 ? `— ${deltaPct.toFixed(2)}% remaining` : `— ${Math.abs(deltaPct).toFixed(2)}% over`}</>
            )}
          </span>
        )}
      </div>

      {/* Target litres (percent mode only — sets the total blend volume for reports/calculation) */}
      {inputMode === 'percent' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Total blend volume (L)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={targetLitres || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateTrial({ ...trial, targetLitres: isNaN(val) ? 0 : val });
            }}
            placeholder="e.g. 10000"
            className="w-48 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Component rows */}
      <div className="space-y-2">
        {trial.components.map((component, i) => (
          <BlendComponentRow
            key={i}
            component={component}
            lots={lots}
            inputMode={inputMode}
            onUpdate={(partial) => updateComponent(i, partial)}
            onRemove={() => removeComponent(i)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={addComponent}
          className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium transition-colors"
        >
          <Plus size={15} />
          Add lot
        </button>

        <button
          onClick={onCalculate}
          disabled={isCalculating || !canCalculate}
          className="ml-auto flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {isCalculating ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FlaskConical size={15} />
          )}
          {isCalculating ? 'Calculating…' : 'Calculate Blend'}
        </button>
      </div>
    </div>
  );
}
