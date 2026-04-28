import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ComponentsSummary, VintageRow, VarietalRow, AppellationRow } from '../../api/innovint';
import { useReferenceData } from '../../context/ReferenceDataContext';
import { fmtPct, fmtLitres, fmtVintage } from '../../utils/format';

interface Props {
  data: ComponentsSummary;
  totalLitres?: number;
}

// Palette — ordered by visual prominence
const COLORS = [
  '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#7c3aed', '#8b5cf6', '#a78bfa', '#6d28d9', '#4c1d95',
];

function sliceColor(i: number) {
  return COLORS[i % COLORS.length];
}

// API returns percentage as decimal fraction (0.5 = 50%)
function toPct(row: { percentage?: number; percent?: number }): number {
  const raw = row.percentage ?? row.percent ?? 0;
  return raw > 1 ? raw : raw * 100;
}

function apiLitres(row: VintageRow | VarietalRow | AppellationRow): number | undefined {
  const v = row.liters ?? row.litres;
  return v != null ? Number(v) : undefined;
}

function calcLitres(
  row: VintageRow | VarietalRow | AppellationRow,
  totalLitres?: number,
): number | undefined {
  const api = apiLitres(row);
  if (api != null) return api;
  if (totalLitres != null) {
    const raw = row.percentage ?? row.percent ?? 0;
    const frac = raw > 1 ? raw / 100 : raw;
    return frac * totalLitres;
  }
  return undefined;
}

// ─── Shared pie + table card ──────────────────────────────────────────────────

interface PieRow {
  label: string;
  pct: number;
  litres?: number;
}

const PCT_THRESHOLD = 0.0001;

function rollupSmall(rows: PieRow[]): PieRow[] {
  const big = rows.filter((r) => r.pct >= PCT_THRESHOLD);
  const small = rows.filter((r) => r.pct < PCT_THRESHOLD);
  if (small.length === 0) return rows;
  const otherPct = small.reduce((s, r) => s + r.pct, 0);
  const otherLitres = small.some((r) => r.litres != null)
    ? small.reduce((s, r) => s + (r.litres ?? 0), 0)
    : undefined;
  return [...big, { label: 'Other', pct: otherPct, litres: otherLitres }];
}

function CompositionCard({
  title,
  rows,
  showLitres,
}: {
  title: string;
  rows: PieRow[];
  showLitres: boolean;
}) {
  const pieData = rows.map((r) => ({ name: r.label, value: r.pct }));
  const total = rows.reduce((s, r) => s + r.pct, 0);
  const totalL = showLitres ? rows.reduce((s, r) => s + (r.litres ?? 0), 0) : undefined;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h4>
      <div className="flex gap-4 items-start">
        {/* Pie chart */}
        <div className="shrink-0 w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={42}
                strokeWidth={1}
                stroke="#fff"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={sliceColor(i)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${fmtPct(v)}%`, '']}
                contentStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-right py-1 pr-2 font-medium text-slate-400 w-14">%</th>
                <th className="text-left py-1 font-medium text-slate-400">Name</th>
                {showLitres && (
                  <th className="text-right py-1 pl-2 font-medium text-slate-400">Litres</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-1 pr-2 text-right tabular-nums font-medium text-slate-700">
                    {fmtPct(r.pct)}
                  </td>
                  <td className="py-1 text-slate-800 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-sm shrink-0"
                      style={{ background: sliceColor(i) }}
                    />
                    {r.label}
                  </td>
                  {showLitres && (
                    <td className="py-1 pl-2 text-right tabular-nums text-slate-600">
                      {r.litres != null ? fmtLitres(r.litres) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="py-1 pr-2 text-right tabular-nums font-bold text-slate-800">
                  {fmtPct(total)}
                </td>
                <td />
                {showLitres && (
                  <td className="py-1 pl-2 text-right tabular-nums font-bold text-slate-800">
                    {totalL != null ? fmtLitres(totalL) : ''}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Appellation card with expand ────────────────────────────────────────────

function AppellationCard({
  appellations,
  totalLitres,
}: {
  appellations: AppellationRow[];
  totalLitres?: number;
}) {
  const { appellations: appMap } = useReferenceData();
  const [expanded, setExpanded] = useState(false);

  const rows: PieRow[] = rollupSmall(appellations.map((app, i) => {
    const id = String(app.appellationId ?? app.id ?? '');
    const name = (appMap[id] ?? app.name ?? id) || `Appellation ${i + 1}`;
    return { label: name, pct: toPct(app), litres: calcLitres(app, totalLitres) };
  }));

  const showLitres = rows.some((r) => r.litres != null);
  const pieData = rows.map((r) => ({ name: r.label, value: r.pct }));
  const total = rows.reduce((s, r) => s + r.pct, 0);
  const totalL = showLitres ? rows.reduce((s, r) => s + (r.litres ?? 0), 0) : undefined;

  // Sub-appellation rows (expand)
  const allSubs = appellations.flatMap((app) =>
    ((app.subAppellations ?? []) as AppellationRow[]).map((h, hi) => {
      const hId = String(h.appellationId ?? h.id ?? '');
      const hName = (appMap[hId] ?? h.name ?? hId) || '—';
      return { label: hName, pct: toPct(h), litres: calcLitres(h, totalLitres), color: sliceColor(hi + appellations.length) };
    })
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Appellation (GI)
      </h4>
      <div className="flex gap-4 items-start">
        <div className="shrink-0 w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={42} strokeWidth={1} stroke="#fff">
                {pieData.map((_, i) => <Cell key={i} fill={sliceColor(i)} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${fmtPct(v)}%`, '']} contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-right py-1 pr-2 font-medium text-slate-400 w-14">%</th>
                <th className="text-left py-1 font-medium text-slate-400">Appellation</th>
                {showLitres && <th className="text-right py-1 pl-2 font-medium text-slate-400">Litres</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-1 pr-2 text-right tabular-nums font-medium text-slate-700">{fmtPct(r.pct)}</td>
                  <td className="py-1 text-slate-800 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ background: sliceColor(i) }} />
                    {r.label}
                  </td>
                  {showLitres && (
                    <td className="py-1 pl-2 text-right tabular-nums text-slate-600">
                      {r.litres != null ? fmtLitres(r.litres) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="py-1 pr-2 text-right tabular-nums font-bold text-slate-800">{fmtPct(total)}</td>
                <td />
                {showLitres && (
                  <td className="py-1 pl-2 text-right tabular-nums font-bold text-slate-800">
                    {totalL != null ? fmtLitres(totalL) : ''}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>

          {allSubs.length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {expanded ? 'Collapse' : 'Expand'} Appellation
            </button>
          )}

          {expanded && allSubs.length > 0 && (
            <table className="w-full text-xs mt-2 border-t border-slate-100 pt-1">
              <tbody>
                {allSubs.map((h, j) => (
                  <tr key={j} className="border-b border-slate-50 last:border-0">
                    <td className="py-1 pr-2 text-right tabular-nums text-slate-600 w-14">{fmtPct(h.pct)}</td>
                    <td className="py-1 text-slate-700 flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ background: h.color }} />
                      {h.label}
                    </td>
                    {showLitres && (
                      <td className="py-1 pl-2 text-right tabular-nums text-slate-500">
                        {h.litres != null ? fmtLitres(h.litres) : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function JuiceWineComposition({ data, totalLitres }: Props) {
  const { varietals: varMap } = useReferenceData();

  const vintages = data.vintages ?? [];
  const varietalList = data.varietals ?? [];
  const appellationList = data.appellations ?? [];

  if (!vintages.length && !varietalList.length && !appellationList.length) {
    return <p className="text-sm text-slate-400 italic">No composition data available.</p>;
  }

  const vintageRows: PieRow[] = rollupSmall(vintages.map((v) => ({
    label: fmtVintage(v.vintage ?? v.year),
    pct: toPct(v),
    litres: calcLitres(v, totalLitres),
  })));

  const varietalRows: PieRow[] = rollupSmall(varietalList.map((v) => {
    const id = String(v.varietalId ?? v.id ?? '');
    const name = (varMap[id] ?? v.name ?? id) || 'Unknown';
    return { label: name, pct: toPct(v), litres: calcLitres(v, totalLitres) };
  }));

  const showLitres = totalLitres != null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vintages.length > 0 && (
        <CompositionCard title="Vintage" rows={vintageRows} showLitres={showLitres} />
      )}
      {varietalList.length > 0 && (
        <CompositionCard title="Varietal" rows={varietalRows} showLitres={showLitres} />
      )}
      {appellationList.length > 0 && (
        <AppellationCard appellations={appellationList} totalLitres={totalLitres} />
      )}
    </div>
  );
}
