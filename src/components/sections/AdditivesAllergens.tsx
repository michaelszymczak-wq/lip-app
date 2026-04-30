import type { Additive } from '../../api/innovint';
import { useReferenceData } from '../../context/ReferenceDataContext';

interface Props {
  data: Additive[];
}

function resolveAmount(additive: Additive): { value: string; unit: string } {
  const raw = additive.amount;
  if (raw == null) return { value: '—', unit: '—' };
  if (typeof raw === 'object') {
    return {
      value: raw.value != null ? String(raw.value) : '—',
      unit: raw.unit ?? '—',
    };
  }
  return {
    value: String(raw),
    unit: String(additive.unitOfMeasure ?? additive.uom ?? '—'),
  };
}

// Labels that do not constitute a true allergen
const NON_ALLERGEN_LABELS = new Set(['vegan', 'organic']);

function resolveAllergen(additive: Additive, indicatorNames: string[]): boolean {
  // If we have resolved names, use them — filter out non-allergen labels
  if (indicatorNames.length > 0) {
    return indicatorNames.some((n) => !NON_ALLERGEN_LABELS.has(n.toLowerCase()));
  }
  // Fall back to API boolean flags when no indicators are available
  if (additive.isAllergen != null) return Boolean(additive.isAllergen);
  if (additive.allergen != null) return Boolean(additive.allergen);
  return false;
}

function resolveName(additive: Additive, productMap: Record<string, string>): string {
  const refId = String(additive.additiveId ?? additive.id ?? '');
  if (refId && productMap[refId]) return productMap[refId];
  return String((additive.name ?? additive.additiveName ?? refId) || '—');
}

// Returns indicator names, looking up IDs via the dryGoodIndicators map
function resolveIndicators(
  additive: Additive,
  indicatorMap: Record<string, string>,
): string[] {
  const embedded = (additive as Record<string, unknown>).indicators;
  if (Array.isArray(embedded) && embedded.length > 0) {
    const names = embedded
      .map((ind: unknown) => {
        if (!ind || typeof ind !== 'object') return String(ind ?? '');
        const i = ind as Record<string, unknown>;
        const id = String(i.id ?? '');
        if (id && indicatorMap[id]) return indicatorMap[id];
        return String(i.name ?? i.abbreviation ?? id ?? '');
      })
      .filter(Boolean);
    if (names.length > 0) return names;
  }
  if (Array.isArray(additive.indicatorIds) && additive.indicatorIds.length > 0) {
    return additive.indicatorIds.map((id) => indicatorMap[String(id)] ?? String(id));
  }
  return [];
}

export function AdditivesAllergens({ data }: Props) {
  const { additiveProducts, dryGoodIndicators } = useReferenceData();
  if (data.length === 0) {
    return <p className="text-sm text-slate-400 italic">No additives recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Additive</th>
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Batch</th>
            <th className="text-right py-2 px-3 font-medium text-slate-500 text-xs">Amount</th>
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Unit</th>
            <th className="text-center py-2 px-3 font-medium text-slate-500 text-xs">Allergen</th>
            <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs">Allergen Type</th>
          </tr>
        </thead>
        <tbody>
          {data.map((additive, i) => {
            const { value, unit } = resolveAmount(additive);
            const indicators = resolveIndicators(additive, dryGoodIndicators);
            const isAllergen = resolveAllergen(additive, indicators);
            return (
              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-800 font-medium">
                  {resolveName(additive, additiveProducts)}
                </td>
                <td className="py-2 px-3 text-slate-500 text-xs">
                  {additive.batchNumber ?? '—'}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-800">{value}</td>
                <td className="py-2 px-3 text-slate-600">{unit}</td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isAllergen
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isAllergen ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-2 px-3">
                  {indicators.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {indicators.map((name, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-100"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
