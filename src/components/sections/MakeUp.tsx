import type { ComponentsSummary } from '../../api/innovint';
import { fmtPct } from '../../utils/format';

interface Props {
  data: ComponentsSummary;
}

function PercentBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
      <div
        className={`${color} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function MakeUp({ data }: Props) {
  const makeup = data.makeup as Record<string, unknown> | undefined;

  // Try multiple possible field names from the API
  const jwPct =
    (makeup?.juiceWinePercent as number) ??
    (makeup?.juiceWine as number) ??
    (makeup?.juice_wine_percent as number) ??
    null;
  const csPct =
    (makeup?.cultureSweetenerPercent as number) ??
    (makeup?.cultureSweetener as number) ??
    (makeup?.culture_sweetener_percent as number) ??
    null;

  if (jwPct == null && csPct == null) {
    return (
      <p className="text-sm text-slate-400 italic">
        Make-up data not available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">
            Juice / Wine
          </p>
          <p className="text-2xl font-semibold text-amber-900 mt-1">
            {jwPct != null ? fmtPct(jwPct) : '—'}%
          </p>
          {jwPct != null && (
            <PercentBar value={jwPct} color="bg-amber-500" />
          )}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
            Culture / Sweetener
          </p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">
            {csPct != null ? fmtPct(csPct) : '—'}%
          </p>
          {csPct != null && (
            <PercentBar value={csPct} color="bg-slate-400" />
          )}
        </div>
      </div>
      {jwPct != null && csPct != null && (
        <p className="text-xs text-slate-500">
          Total: {fmtPct(jwPct + csPct)}% (must equal 100%)
        </p>
      )}
    </div>
  );
}
