import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { Lot, ComponentsSummary, Additive, Analysis, BlockComponent, Bond, LotMakeup } from '../api/innovint';
import { useReferenceData } from '../context/ReferenceDataContext';
import { toL } from '../utils/format';
import { generateDeclarationReport, computeSwaPercent, detectVegan } from '../reports/declaration';
import { generateCompositionReport } from '../reports/composition';
import { generateDispatchReport } from '../reports/dispatch';
import type { DeclarationParams } from '../reports/types';
import { DeclarationParamsModal } from './reports/DeclarationParamsModal';
import { CompositionDecimalsModal } from './reports/CompositionDecimalsModal';

interface ReportButtonsProps {
  lotId: string | null;
  lot: Lot | null;
  bond: Bond | null;
  summary: ComponentsSummary | null;
  makeup: LotMakeup | null;
  additives: Additive[] | null;
  analyses: Analysis[] | null;
  blockComponents: BlockComponent[] | null;
  blockTags: Record<string, string[]>;
  onToast: (message: string) => void;
}

type ReportKey = 'declaration' | 'composition' | 'dispatch';

export function ReportButtons({
  lotId,
  lot,
  bond,
  summary,
  makeup,
  additives,
  analyses,
  blockComponents,
  blockTags,
  onToast,
}: ReportButtonsProps) {
  const { varietals: varietalMap, appellations: appellationMap, additiveProducts, dryGoodIndicators } = useReferenceData();
  const [loading, setLoading] = useState<ReportKey | null>(null);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showDecimalsModal, setShowDecimalsModal] = useState<'composition' | 'dispatch' | null>(null);

  const hasData = !!lotId && !!lot && !!summary;
  const baseDisabled = !hasData;

  function assembleCommon() {
    const totalLitres = toL(lot?.volume);
    const vesselName = bond?.name ?? bond?.code ?? lot?.bondId ?? '—';
    const vesselCapacity = bond?.capacity != null ? Number(bond.capacity) : undefined;
    const swaPercent = blockComponents ? computeSwaPercent(blockComponents, blockTags) : undefined;
    const isVegan = additives ? detectVegan(additives, dryGoodIndicators) : null;

    // Derive juice/wine and culture/sweetener from the makeup API data
    const makeupKeys = ['juiceWine', 'juiceConcentrate', 'yeastCulture', 'water', 'additive'] as const;
    const totalMakeupVol = makeup
      ? makeupKeys.reduce((s, k) => s + (makeup[k]?.volume?.value ?? 0), 0)
      : 0;
    const jwLitres = makeup?.juiceWine?.volume?.value ?? 0;
    const cultureLitres = (makeup?.yeastCulture?.volume?.value ?? 0) + (makeup?.juiceConcentrate?.volume?.value ?? 0);
    const makeupPercentages = totalMakeupVol > 0 ? {
      juiceWinePercent: jwLitres > 0 ? (jwLitres / totalMakeupVol) * 100 : undefined,
      juiceWineLitres: jwLitres > 0 ? jwLitres : undefined,
      culturePercent: cultureLitres > 0 ? (cultureLitres / totalMakeupVol) * 100 : undefined,
      cultureLitres: cultureLitres > 0 ? cultureLitres : undefined,
    } : {};

    return {
      lotNumber: lot?.code ?? '—',
      lotName: lot?.name ?? '—',
      vesselName,
      vesselCapacity,
      totalLitres,
      ...makeupPercentages,
      varietals: summary?.varietals ?? [],
      vintages: summary?.vintages ?? [],
      appellations: summary?.appellations ?? [],
      additives: additives ?? [],
      analyses: analyses ?? [],
      varietalMap,
      appellationMap,
      additiveProducts,
      dryGoodIndicators,
      swaPercent,
      isVegan,
    };
  }

  async function handleDeclaration(params: DeclarationParams) {
    setShowDeclarationModal(false);
    setLoading('declaration');
    try {
      await generateDeclarationReport({ ...assembleCommon(), params });
    } catch (err) {
      console.error('[ReportButtons] PDF generation failed:', err);
      onToast(err instanceof Error ? err.message : String(err) || 'PDF generation failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleComposition(decimals: number) {
    setShowDecimalsModal(null);
    setLoading('composition');
    try {
      await generateCompositionReport({ ...assembleCommon(), compositionDecimals: decimals });
    } catch (err) {
      console.error('[ReportButtons] PDF generation failed:', err);
      onToast(err instanceof Error ? err.message : String(err) || 'PDF generation failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleDispatch(decimals: number) {
    setShowDecimalsModal(null);
    setLoading('dispatch');
    try {
      await generateDispatchReport({ ...assembleCommon(), compositionDecimals: decimals });
    } catch (err) {
      console.error('[ReportButtons] PDF generation failed:', err);
      onToast(err instanceof Error ? err.message : String(err) || 'PDF generation failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowDeclarationModal(true)}
          disabled={baseDisabled || loading === 'declaration'}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading === 'declaration' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          LIP Declaration Report
        </button>

        <button
          onClick={() => setShowDecimalsModal('composition')}
          disabled={baseDisabled || loading === 'composition'}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading === 'composition' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Composition Details Report
        </button>

        <button
          onClick={() => setShowDecimalsModal('dispatch')}
          disabled={baseDisabled || loading === 'dispatch'}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading === 'dispatch' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Dispatch Approval Report
        </button>
      </div>

      {showDeclarationModal && lot && (
        <DeclarationParamsModal
          lotNumber={lot.code ?? '—'}
          lotName={lot.name ?? '—'}
          onGenerate={handleDeclaration}
          onClose={() => setShowDeclarationModal(false)}
        />
      )}

      {showDecimalsModal && lot && (
        <CompositionDecimalsModal
          reportTitle={showDecimalsModal === 'composition' ? 'Composition Details Report' : 'Dispatch Approval Report'}
          lotNumber={lot.code ?? '—'}
          lotName={lot.name ?? '—'}
          onGenerate={showDecimalsModal === 'composition' ? handleComposition : handleDispatch}
          onClose={() => setShowDecimalsModal(null)}
        />
      )}
    </>
  );
}
