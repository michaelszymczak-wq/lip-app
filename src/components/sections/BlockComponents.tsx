import { useEffect, useState } from 'react';
import type { BlockComponent } from '../../api/innovint';
import { fetchBlock } from '../../api/innovint';
import { useAuth } from '../../context/AuthContext';
import { fmtPct, fmtVintage } from '../../utils/format';

interface Props {
  data: BlockComponent[];
}

function toPct(pct: number | undefined): number {
  if (pct == null) return 0;
  return pct > 1 ? pct : pct * 100;
}

export function BlockComponents({ data }: Props) {
  const { token } = useAuth();
  const [blockTags, setBlockTags] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!token || data.length === 0) return;
    const uniqueIds = [...new Set(
      data.map((r) => r.block?.id).filter((id): id is string => !!id)
    )];
    Promise.all(
      uniqueIds.map((id) =>
        fetchBlock(token, id)
          .then((b) => ({ id, tags: b.tags ?? [] }))
          .catch(() => ({ id, tags: [] }))
      )
    ).then((results) => {
      const map: Record<string, string[]> = {};
      results.forEach(({ id, tags }) => { map[id] = tags; });
      setBlockTags(map);
    });
  }, [token, data]);

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 italic">No block components recorded.</p>;
  }

  const PCT_THRESHOLD = 0.0001;
  const displayData = data.filter((row) => toPct(row.percentage) >= PCT_THRESHOLD);
  const smallData = data.filter((row) => toPct(row.percentage) < PCT_THRESHOLD);
  const showOther = smallData.length > 0;
  const otherPct = smallData.reduce((s, r) => s + toPct(r.percentage), 0);

  // Roll up percentages by tag across all block components
  const tagTotals: Record<string, number> = {};
  data.forEach((row) => {
    const tags = blockTags[row.block?.id ?? ''] ?? [];
    const pct = toPct(row.percentage);
    tags.forEach((tag) => {
      tagTotals[tag] = (tagTotals[tag] ?? 0) + pct;
    });
  });
  const tagEntries = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Vineyard</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Block</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Tags</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Varietal</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Appellation</th>
              <th className="text-center py-2 px-3 font-medium text-slate-500 text-xs">Vintage</th>
              <th className="text-right py-2 px-3 font-medium text-slate-500 text-xs">%</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => {
              const blockId = row.block?.id ?? '';
              const tags = blockTags[blockId] ?? [];
              return (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-800 font-medium">{row.vineyard?.name ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-700">{row.block?.name ?? '—'}</td>
                  <td className="py-2 px-3">
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-700">{row.varietal?.name ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-600">{row.appellation?.name ?? '—'}</td>
                  <td className="py-2 px-3 text-center text-slate-700">{fmtVintage(row.vintage)}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-medium text-slate-800">
                    {fmtPct(toPct(row.percentage))}%
                  </td>
                </tr>
              );
            })}
            {showOther && (
              <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td colSpan={6} className="py-2 px-3 text-slate-400 italic">Other</td>
                <td className="py-2 px-3 text-right tabular-nums font-medium text-slate-800">
                  {fmtPct(otherPct)}%
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tagEntries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            SWA Status
          </p>
          <div className="flex flex-wrap gap-2">
            {tagEntries.map(([tag, pct]) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100"
              >
                <span className="text-xs font-semibold text-blue-800">{tag}</span>
                <span className="text-xs text-blue-600 tabular-nums">{fmtPct(pct)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
