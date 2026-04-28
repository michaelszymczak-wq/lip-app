import type { LotMakeup } from '../../api/innovint';

interface Props {
  data: LotMakeup;
}

const KEYS = ['juiceWine', 'juiceConcentrate', 'yeastCulture', 'water', 'additive'] as const;
type MakeupKey = typeof KEYS[number];

const LABELS: Record<MakeupKey, string> = {
  juiceWine: 'Juice / Wine',
  juiceConcentrate: 'Juice Concentrate',
  yeastCulture: 'Yeast Culture',
  water: 'Water',
  additive: 'Liquid Additives',
};

const BAR_COLORS: Record<MakeupKey, string> = {
  juiceWine: 'bg-amber-500',
  juiceConcentrate: 'bg-orange-400',
  yeastCulture: 'bg-green-500',
  water: 'bg-blue-400',
  additive: 'bg-purple-500',
};

const DOT_COLORS: Record<MakeupKey, string> = {
  juiceWine: 'bg-amber-500',
  juiceConcentrate: 'bg-orange-400',
  yeastCulture: 'bg-green-500',
  water: 'bg-blue-400',
  additive: 'bg-purple-500',
};

function fmtVol(value: number, unit: string): string {
  if (value === 0) return '—';
  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
}

function fmtPct(value: number): string {
  return `${value.toFixed(4)}%`;
}

export function LotMakeupView({ data }: Props) {
  const rows = KEYS.map((k) => ({
    key: k,
    label: LABELS[k],
    volume: data[k]?.volume?.value ?? 0,
    unit: data[k]?.volume?.unit ?? 'litres',
  }));

  const totalVolume = rows.reduce((s, r) => s + r.volume, 0);

  const rowsWithPct = rows.map((r) => ({
    ...r,
    pct: totalVolume > 0 ? (r.volume / totalVolume) * 100 : 0,
  }));

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      {totalVolume > 0 && (
        <div className="h-5 flex rounded-full overflow-hidden">
          {rowsWithPct
            .filter((r) => r.pct > 0)
            .map((r) => (
              <div
                key={r.key}
                className={`${BAR_COLORS[r.key]} transition-all`}
                style={{ width: `${r.pct}%` }}
                title={`${r.label}: ${fmtPct(r.pct)}`}
              />
            ))}
        </div>
      )}

      {/* Breakdown table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Component</th>
            <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Volume</th>
            <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {rowsWithPct.map((r, i) => (
            <tr
              key={r.key}
              className={`border-b border-slate-100 ${r.volume === 0 ? 'opacity-40' : ''}`}
            >
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLORS[r.key]}`} />
                  <span className={`text-slate-800 ${i === 0 ? 'font-medium' : ''}`}>{r.label}</span>
                </div>
              </td>
              <td className="py-2 pr-4 text-right text-slate-700 tabular-nums">
                {fmtVol(r.volume, r.unit)}
              </td>
              <td className="py-2 text-right text-slate-700 tabular-nums">
                {r.volume > 0 ? fmtPct(r.pct) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-2 pr-4 text-xs font-semibold text-slate-600">Total</td>
            <td className="py-2 pr-4 text-right text-xs font-semibold text-slate-600 tabular-nums">
              {fmtVol(totalVolume, rows[0]?.unit ?? 'litres')}
            </td>
            <td className="py-2 text-right text-xs font-semibold text-slate-600">
              {totalVolume > 0 ? '100.0000%' : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
