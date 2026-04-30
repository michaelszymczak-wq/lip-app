import type { ComponentsSummary, Additive, Analysis, BlockComponent, VarietalRow, VintageRow, AppellationRow } from '../api/innovint';

export interface BlendComponent {
  lotId: string;
  lotCode: string;   // cached display label
  litres: number;    // used in volume mode
  percent?: number;  // used in percent mode (0–100, stored directly, unconstrained)
}

export interface BlendTrial {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  components: BlendComponent[];
  targetLitres?: number;   // used when user is in percent input mode
}

export interface LotBlendData {
  lotId: string;
  summary: ComponentsSummary;
  additives: Additive[];
  analyses: Analysis[];
  blockComponents: BlockComponent[];
  blockTags: Record<string, string[]>;
}

export interface BlendResult {
  totalLitres: number;
  varietals: VarietalRow[];
  vintages: VintageRow[];
  appellations: AppellationRow[];
  analyses: Analysis[];
  additives: Additive[];
  swaPercent: number;
  isVegan: boolean | null;
}
