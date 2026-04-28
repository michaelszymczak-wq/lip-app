import type { Additive, Analysis, VarietalRow, VintageRow, AppellationRow } from '../api/innovint';

// ─── Shared base ──────────────────────────────────────────────────────────────

export interface LotSummary {
  lotNumber: string;
  lotName: string;
  vesselName: string;
  vesselCapacity?: number;
  totalLitres?: number;
  juiceWinePercent?: number;
  juiceWineLitres?: number;
  culturePercent?: number;
  cultureLitres?: number;
}

// ─── Shared composition payload ───────────────────────────────────────────────

export interface CompositionPayload {
  varietals: VarietalRow[];
  vintages: VintageRow[];
  appellations: AppellationRow[];
  additives: Additive[];
  analyses: Analysis[];
  varietalMap: Record<string, string>;
  appellationMap: Record<string, string>;
  additiveProducts: Record<string, string>;
  dryGoodIndicators: Record<string, string>;
  swaPercent?: number;
  isVegan?: boolean | null;
  compositionDecimals?: number;
}

// ─── Declaration ─────────────────────────────────────────────────────────────

export interface DeclarationParams {
  compositionDataId: string;
  showAnalysis: boolean;
  showAllergens: boolean;
  showAppellation: boolean;
  showDetailedAppellation: boolean;
  showCulture: boolean;
  showSwa: boolean;
  declarantName: string;
  declarantTitle: string;
  goodsDescription: string;
  compositionDecimals: number;
}

export interface DeclarationReportData extends LotSummary, CompositionPayload {
  params: DeclarationParams;
}

// ─── Composition ─────────────────────────────────────────────────────────────

export type CompositionReportData = LotSummary & CompositionPayload;

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export interface LabelComplianceRow {
  market: string;
  tolerance: number;
  latestResult: number;
  labelValue: number;
  minLabel: number;
  maxLabel: number;
  status: 'COMPLIANT' | 'NON-COMPLIANT' | 'PENDING';
}

export interface DispatchReportData extends LotSummary, CompositionPayload {
  labelCompliance?: LabelComplianceRow[];
}
