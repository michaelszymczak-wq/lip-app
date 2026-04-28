import { useState } from 'react';
import type { ComponentsSummary } from '../../api/innovint';
import { useReferenceData } from '../../context/ReferenceDataContext';
import { fmtPct, fmtLitres, fmtVintage } from '../../utils/format';

interface Props {
  data: ComponentsSummary;
}

type ViewMode = 'juiceWineOnly' | 'entireVessel';

export function VesselView({ data }: Props) {
  const { varietals, appellations } = useReferenceData();
  const [mode, setMode] = useState<ViewMode>('juiceWineOnly');

  const vesselComp = data.vesselComposition as Record<string, unknown> | undefined;
  if (!vesselComp) {
    return (
      <p className="text-sm text-slate-400 italic">
        Vessel composition data not available.
      </p>
    );
  }

  const rows = (
    (vesselComp[mode] ?? []) as Array<Record<string, unknown>>
  );

  function resolveName(
    idField: string | undefined,
    map: Record<string, string>,
    fallback: string | undefined,
  ): string {
    if (idField && map[idField]) return map[idField];
    return fallback ?? idField ?? '—';
  }

  const PCT_THRESHOLD = 0.0001;
  const displayRows = rows.filter((row) => Number(row.percent ?? 0) >= PCT_THRESHOLD);
  const smallRows = rows.filter((row) => Number(row.percent ?? 0) < PCT_THRESHOLD);
  const showOther = smallRows.length > 0;
  const otherPct = smallRows.reduce((s, r) => s + Number(r.percent ?? 0), 0);
  const otherLitres = smallRows.some((r) => r.litres != null)
    ? smallRows.reduce((s, r) => s + Number(r.litres ?? 0), 0)
    : null;

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('juiceWineOnly')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'juiceWineOnly'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Juice / Wine Only
        </button>
        <button
          onClick={() => setMode('entireVessel')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'entireVessel'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Entire Vessel
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No data for this view.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">
                  Vintage
                </th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">
                  Varietal
                </th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">
                  Appellation
                </th>
                <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">
                  Wine Type
                </th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 text-xs">
                  %
                </th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 text-xs">
                  Litres
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="py-2 px-3 text-slate-800 tabular-nums">
                    {fmtVintage(row.vintage)}
                  </td>
                  <td className="py-2 px-3 text-slate-800">
                    {resolveName(
                      String(row.varietalId ?? ''),
                      varietals,
                      row.varietal as string,
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-800">
                    {resolveName(
                      String(row.appellationId ?? ''),
                      appellations,
                      row.appellation as string,
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {String(row.wineType ?? '—')}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-800">
                    {fmtPct(Number(row.percent ?? 0))}%
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600">
                    {row.litres != null
                      ? `${fmtLitres(Number(row.litres))} L`
                      : '—'}
                  </td>
                </tr>
              ))}
              {showOther && (
                <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td colSpan={4} className="py-2 px-3 text-slate-400 italic">Other</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-800">
                    {fmtPct(otherPct)}%
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600">
                    {otherLitres != null ? `${fmtLitres(otherLitres)} L` : '—'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
