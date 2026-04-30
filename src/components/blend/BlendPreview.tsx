import type { BlendResult } from '../../blend/types';
import type { ComponentsSummary } from '../../api/innovint';
import { SectionCard } from '../SectionCard';
import { JuiceWineComposition } from '../sections/JuiceWineComposition';
import { AdditivesAllergens } from '../sections/AdditivesAllergens';
import { LabAnalysis } from '../sections/LabAnalysis';

interface Props {
  result: BlendResult;
}

export function BlendPreview({ result }: Props) {
  if (result.totalLitres === 0) return null;

  const syntheticSummary: ComponentsSummary = {
    varietals: result.varietals,
    vintages: result.vintages,
    appellations: result.appellations,
  };

  const swaCertified = result.swaPercent >= 85;
  const swaColor = swaCertified ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600';

  const veganColor =
    result.isVegan === true
      ? 'bg-green-100 text-green-800'
      : result.isVegan === false
      ? 'bg-red-100 text-red-800'
      : 'bg-slate-100 text-slate-500';

  const veganLabel =
    result.isVegan === true ? 'Vegan' : result.isVegan === false ? 'Not Vegan' : 'Vegan unknown';

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
          {result.totalLitres.toLocaleString()} L total
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${swaColor}`}>
          {swaCertified ? 'SWA Certified' : 'Not SWA Certified'} ({result.swaPercent.toFixed(4)}%)
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${veganColor}`}>
          {veganLabel}
        </span>
      </div>

      {/* Varietal & Vintage */}
      <SectionCard title="Varietal & Vintage Breakdown">
        <JuiceWineComposition data={syntheticSummary} totalLitres={result.totalLitres} />
      </SectionCard>

      {/* Additives */}
      <SectionCard
        title="Additives & Allergens"
        badge={
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {result.additives.length}
          </span>
        }
      >
        <AdditivesAllergens data={result.additives} />
      </SectionCard>

      {/* Lab Analysis */}
      <SectionCard
        title="Laboratory Analysis"
        badge={
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {result.analyses.length}
          </span>
        }
      >
        <LabAnalysis data={result.analyses} />
      </SectionCard>
    </div>
  );
}
