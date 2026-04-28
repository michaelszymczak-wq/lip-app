import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Analysis } from '../../api/innovint';

interface Props {
  data: Analysis[];
}

function resolveDate(a: Analysis): string | undefined {
  return a.recordedAt ?? a.date ?? a.analysisDate ?? a.createdAt;
}

function formatDate(raw: string | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function resolveName(a: Analysis): string {
  const type = a.analysisType;
  if (type) {
    return String(type.name ?? type.abbreviation ?? '—');
  }
  return String(a.name ?? (a as Record<string, unknown>).analysisName ?? '—');
}

function resolveValue(a: Analysis): string {
  const v = a.value ?? (a as Record<string, unknown>).result;
  return v != null ? String(v) : '—';
}

function resolveUnit(a: Analysis): string {
  if (a.unit?.unit) return a.unit.unit;
  const type = a.analysisType;
  if (type?.unit) return String(type.unit);
  return String(a.unitOfMeasure ?? a.uom ?? '—');
}

type SortDir = 'asc' | 'desc';

export function LabAnalysis({ data }: Props) {
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 italic">No lab analyses recorded.</p>;
  }

  // Keep only the most recent entry per analysis type
  const latestByType = new Map<string, Analysis>();
  for (const a of data) {
    const key = resolveName(a);
    const existing = latestByType.get(key);
    if (!existing) {
      latestByType.set(key, a);
    } else {
      const ta = new Date(resolveDate(a) ?? '').getTime() || 0;
      const te = new Date(resolveDate(existing) ?? '').getTime() || 0;
      if (ta > te) latestByType.set(key, a);
    }
  }

  const sorted = [...latestByType.values()].sort((a, b) => {
    const ta = new Date(resolveDate(a) ?? '').getTime() || 0;
    const tb = new Date(resolveDate(b) ?? '').getTime() || 0;
    return sortDir === 'desc' ? tb - ta : ta - tb;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Analysis</th>
            <th className="text-right py-2 px-3 font-medium text-slate-500 text-xs">Value</th>
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Unit</th>
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">
              <button
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1 hover:text-slate-700 transition-colors"
              >
                Date
                {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((analysis, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
              <td className="py-2 px-3 text-slate-800">{resolveName(analysis)}</td>
              <td className="py-2 px-3 text-right tabular-nums font-medium text-slate-900">
                {resolveValue(analysis)}
              </td>
              <td className="py-2 px-3 text-slate-600">{resolveUnit(analysis)}</td>
              <td className="py-2 px-3 text-slate-600">{formatDate(resolveDate(analysis))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
