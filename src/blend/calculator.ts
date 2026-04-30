import type { BlendComponent, LotBlendData, BlendResult } from './types';
import type { VarietalRow, VintageRow, AppellationRow, Analysis } from '../api/innovint';
import { computeSwaPercent, detectVegan } from '../reports/declaration';

export function computeBlend(
  components: BlendComponent[],
  lotData: Map<string, LotBlendData>,
  dryGoodIndicators: Record<string, string> = {},
): BlendResult {
  // Only include components with a loaded lot and litres > 0
  const active = components.filter((c) => c.litres > 0 && lotData.has(c.lotId));
  const totalLitres = active.reduce((sum, c) => sum + c.litres, 0);

  if (active.length === 0 || totalLitres === 0) {
    return {
      totalLitres: 0,
      varietals: [],
      vintages: [],
      appellations: [],
      analyses: [],
      additives: [],
      swaPercent: 0,
      isVegan: null,
    };
  }

  // ─── Varietals ────────────────────────────────────────────────────────────
  const varietalMap = new Map<string, number>(); // varietalId → combined fraction
  for (const c of active) {
    const w = c.litres / totalLitres;
    const data = lotData.get(c.lotId)!;
    for (const row of data.summary.varietals ?? []) {
      const id = row.varietalId ?? row.id ?? '';
      const rawPct = row.percentage ?? row.percent ?? 0;
      const frac = rawPct > 1 ? rawPct / 100 : rawPct;
      varietalMap.set(id, (varietalMap.get(id) ?? 0) + w * frac);
    }
  }
  const varietals: VarietalRow[] = Array.from(varietalMap.entries()).map(([id, frac]) => ({
    varietalId: id,
    percentage: frac,
  }));

  // ─── Vintages ─────────────────────────────────────────────────────────────
  const vintageMap = new Map<string, number>(); // year key → combined fraction
  for (const c of active) {
    const w = c.litres / totalLitres;
    const data = lotData.get(c.lotId)!;
    for (const row of data.summary.vintages ?? []) {
      const key = String(row.vintage ?? row.year ?? '');
      const rawPct = row.percentage ?? row.percent ?? 0;
      const frac = rawPct > 1 ? rawPct / 100 : rawPct;
      vintageMap.set(key, (vintageMap.get(key) ?? 0) + w * frac);
    }
  }
  const vintages: VintageRow[] = Array.from(vintageMap.entries()).map(([key, frac]) => ({
    vintage: isNaN(Number(key)) ? key : Number(key),
    percentage: frac,
  }));

  // ─── Appellations ─────────────────────────────────────────────────────────
  const appellationMap = new Map<string, number>(); // appellationId → combined fraction
  for (const c of active) {
    const w = c.litres / totalLitres;
    const data = lotData.get(c.lotId)!;
    for (const row of data.summary.appellations ?? []) {
      const id = row.appellationId ?? row.id ?? '';
      const rawPct = row.percentage ?? row.percent ?? 0;
      const frac = rawPct > 1 ? rawPct / 100 : rawPct;
      appellationMap.set(id, (appellationMap.get(id) ?? 0) + w * frac);
    }
  }
  const appellations: AppellationRow[] = Array.from(appellationMap.entries()).map(([id, frac]) => ({
    appellationId: id,
    percentage: frac,
  }));

  // ─── Analyses ─────────────────────────────────────────────────────────────
  // Group by analysis type name; weighted average value
  type AnalysisAccum = { weightedSum: number; totalWeight: number; unit?: string };
  const analysisAccum = new Map<string, AnalysisAccum>();
  for (const c of active) {
    const w = c.litres / totalLitres;
    const data = lotData.get(c.lotId)!;
    for (const a of data.analyses) {
      const typeName = a.analysisType?.name ?? a.analysisType?.abbreviation ?? '';
      if (!typeName) continue;
      const rawVal = a.value ?? a.result;
      const numVal = rawVal != null ? Number(rawVal) : NaN;
      if (isNaN(numVal)) continue;
      const existing = analysisAccum.get(typeName);
      if (existing) {
        existing.weightedSum += w * numVal;
        existing.totalWeight += w;
      } else {
        const unit = a.unitOfMeasure ?? a.uom ?? (a.unit as { name?: string } | undefined)?.name ?? (a.unit as { unit?: string } | undefined)?.unit;
        analysisAccum.set(typeName, { weightedSum: w * numVal, totalWeight: w, unit });
      }
    }
  }
  const analyses: Analysis[] = Array.from(analysisAccum.entries()).map(([typeName, acc]) => ({
    analysisType: { name: typeName },
    value: acc.totalWeight > 0 ? acc.weightedSum / acc.totalWeight : undefined,
    unitOfMeasure: acc.unit,
  }));

  // ─── Additives ────────────────────────────────────────────────────────────
  // Union of all component lots' additives (no deduplication)
  const additives = active.flatMap((c) => lotData.get(c.lotId)!.additives);

  // ─── SWA ──────────────────────────────────────────────────────────────────
  let swaPercent = 0;
  for (const c of active) {
    const w = c.litres / totalLitres;
    const data = lotData.get(c.lotId)!;
    const lotSwa = computeSwaPercent(data.blockComponents, data.blockTags);
    swaPercent += w * lotSwa;
  }

  // ─── Vegan ────────────────────────────────────────────────────────────────
  // We need dryGoodIndicators but it comes from reference data context.
  // The calculator is pure, so we pass an empty map here and rely on the
  // caller (BlendTrials) to pass the real map into BlendReportButtons.
  const isVegan = detectVegan(additives, dryGoodIndicators);

  return { totalLitres, varietals, vintages, appellations, analyses, additives, swaPercent, isVegan };
}
