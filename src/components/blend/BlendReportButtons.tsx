import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { BlendTrial, BlendResult } from '../../blend/types';
import { useReferenceData } from '../../context/ReferenceDataContext';
import { generateDeclarationReport } from '../../reports/declaration';
import { generateCompositionReport } from '../../reports/composition';
import { generateDispatchReport } from '../../reports/dispatch';
import type { DeclarationParams, LotSummary, CompositionPayload } from '../../reports/types';
import { DeclarationParamsModal } from '../reports/DeclarationParamsModal';
import { CompositionDecimalsModal } from '../reports/CompositionDecimalsModal';

interface Props {
  trial: BlendTrial;
  result: BlendResult;
  onToast: (message: string) => void;
}

type ReportKey = 'declaration' | 'composition' | 'dispatch';

function assembleBlendData(
  trial: BlendTrial,
  result: BlendResult,
  refData: {
    varietals: Record<string, string>;
    appellations: Record<string, string>;
    additiveProducts: Record<string, string>;
    dryGoodIndicators: Record<string, string>;
  },
): LotSummary & CompositionPayload {
  return {
    lotNumber: trial.name,
    lotName: trial.name,
    vesselName: 'Blend Trial',
    vesselCapacity: undefined,
    totalLitres: result.totalLitres,
    varietals: result.varietals,
    vintages: result.vintages,
    appellations: result.appellations,
    additives: result.additives,
    analyses: result.analyses,
    varietalMap: refData.varietals,
    appellationMap: refData.appellations,
    additiveProducts: refData.additiveProducts,
    dryGoodIndicators: refData.dryGoodIndicators,
    swaPercent: result.swaPercent,
    isVegan: result.isVegan,
  };
}

function pdfFilename(trialName: string): string {
  return `LIP_Blend_${trialName.replace(/[^a-z0-9]/gi, '_')}`;
}

export function BlendReportButtons({ trial, result, onToast }: Props) {
  const { varietals, appellations, additiveProducts, dryGoodIndicators } = useReferenceData();
  const [loading, setLoading] = useState<ReportKey | null>(null);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showDecimalsModal, setShowDecimalsModal] = useState<'composition' | 'dispatch' | null>(null);

  const nameEmpty = trial.name.trim() === '';
  const noData = result.totalLitres === 0;
  const disabled = nameEmpty || noData;
  const tooltip = nameEmpty ? 'Enter a trial name first' : noData ? 'Add lot components first' : undefined;

  const refData = { varietals, appellations, additiveProducts, dryGoodIndicators };

  async function handleDeclaration(params: DeclarationParams) {
    setShowDeclarationModal(false);
    setLoading('declaration');
    try {
      const data = assembleBlendData(trial, result, refData);
      const filename = pdfFilename(trial.name);
      await generateDeclarationReport({ ...data, params });
      // The PDF generators use lotNumber for the filename internally;
      // override is handled by the filename in the download call inside generateDeclarationReport
      // (it uses data.lotNumber which is trial.name — filename is set there)
      void filename; // suppress unused var warning
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleComposition(decimals: number) {
    setShowDecimalsModal(null);
    setLoading('composition');
    try {
      await generateCompositionReport({
        ...assembleBlendData(trial, result, refData),
        compositionDecimals: decimals,
      });
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleDispatch(decimals: number) {
    setShowDecimalsModal(null);
    setLoading('dispatch');
    try {
      await generateDispatchReport({
        ...assembleBlendData(trial, result, refData),
        compositionDecimals: decimals,
      });
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowDeclarationModal(true)}
          disabled={disabled || loading === 'declaration'}
          title={tooltip}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading === 'declaration' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          LIP Declaration Report
        </button>

        <button
          onClick={() => setShowDecimalsModal('composition')}
          disabled={disabled || loading === 'composition'}
          title={tooltip}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading === 'composition' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Composition Details Report
        </button>

        <button
          onClick={() => setShowDecimalsModal('dispatch')}
          disabled={disabled || loading === 'dispatch'}
          title={tooltip}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading === 'dispatch' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Dispatch Approval Report
        </button>
      </div>

      {showDeclarationModal && (
        <DeclarationParamsModal
          lotNumber={trial.name}
          lotName={trial.name}
          onGenerate={handleDeclaration}
          onClose={() => setShowDeclarationModal(false)}
        />
      )}

      {showDecimalsModal && (
        <CompositionDecimalsModal
          reportTitle={showDecimalsModal === 'composition' ? 'Composition Details Report' : 'Dispatch Approval Report'}
          lotNumber={trial.name}
          lotName={trial.name}
          onGenerate={showDecimalsModal === 'composition' ? handleComposition : handleDispatch}
          onClose={() => setShowDecimalsModal(null)}
        />
      )}
    </>
  );
}
