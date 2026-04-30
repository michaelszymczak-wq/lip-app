import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReferenceData } from '../context/ReferenceDataContext';
import type { Lot } from '../api/innovint';
import {
  fetchLots,
  fetchComponentsSummary,
  fetchAdditives,
  fetchAnalyses,
  fetchBlockComponents,
  fetchBlock,
} from '../api/innovint';
import type { BlendTrial, LotBlendData } from '../blend/types';
import {
  loadTrials,
  saveTrials,
  createTrial,
  upsertTrial,
  deleteTrial,
} from '../blend/storage';
import { computeBlend } from '../blend/calculator';
import { BlendEditor } from './blend/BlendEditor';
import { BlendPreview } from './blend/BlendPreview';
import { BlendReportButtons } from './blend/BlendReportButtons';
import { Toast } from './Toast';

export function BlendTrials() {
  const { token } = useAuth();
  const { dryGoodIndicators } = useReferenceData();

  const [trials, setTrials] = useState<BlendTrial[]>(() => loadTrials());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'volume' | 'percent'>('volume');
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotDataMap, setLotDataMap] = useState<Map<string, LotBlendData>>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Autosave whenever trials change
  useEffect(() => {
    saveTrials(trials);
  }, [trials]);

  // Fetch lots list on mount
  useEffect(() => {
    if (!token) return;
    setLotsLoading(true);
    fetchLots(token)
      .then((data) => {
        data.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''));
        setLots(data);
      })
      .catch((err) => {
        setToast(err?.message ?? 'Failed to load lots');
      })
      .finally(() => setLotsLoading(false));
  }, [token]);

  const activeTrial = trials.find((t) => t.id === activeId) ?? null;

  const blendResult = useMemo(() => {
    if (!activeTrial) return null;
    let components = activeTrial.components;
    if (inputMode === 'percent') {
      // Convert stored percentages to litres for the calculator.
      // targetLitres scales the result; if unset we use 100 so the
      // result totalLitres equals the sum of the entered percentages.
      const scale = activeTrial.targetLitres ?? 100;
      components = components.map((c) => ({
        ...c,
        litres: ((c.percent ?? 0) / 100) * scale,
      }));
    }
    return computeBlend(components, lotDataMap, dryGoodIndicators);
  }, [activeTrial, inputMode, lotDataMap, dryGoodIndicators]);

  const loadLotData = useCallback(
    async (lotId: string): Promise<void> => {
      if (!token || !lotId) return;
      if (lotDataMap.has(lotId)) return; // already cached
      const [summary, additives, rawAnalyses, blockComponents] = await Promise.all([
        fetchComponentsSummary(token, lotId),
        fetchAdditives(token, lotId),
        fetchAnalyses(token, lotId),
        fetchBlockComponents(token, lotId),
      ]);
      const analyses = rawAnalyses.filter((a) => !a.deleted);

      const uniqueBlockIds = [
        ...new Set(
          blockComponents
            .map((r) => r.block?.id)
            .filter((id): id is string => !!id),
        ),
      ];
      const tagResults = await Promise.all(
        uniqueBlockIds.map((id) =>
          fetchBlock(token, id)
            .then((b) => ({ id, tags: (b.tags ?? []) as string[] }))
            .catch(() => ({ id, tags: [] as string[] })),
        ),
      );
      const blockTags: Record<string, string[]> = {};
      tagResults.forEach(({ id, tags }) => { blockTags[id] = tags; });

      setLotDataMap((prev) =>
        new Map(prev).set(lotId, { lotId, summary, additives, analyses, blockComponents, blockTags }),
      );
    },
    [token, lotDataMap],
  );

  async function handleCalculate() {
    if (!activeTrial) return;
    const lotIds = [
      ...new Set(
        activeTrial.components
          .map((c) => c.lotId)
          .filter(Boolean),
      ),
    ];
    if (lotIds.length === 0) return;
    setIsCalculating(true);
    try {
      await Promise.all(lotIds.map(loadLotData));
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to load lot data');
    } finally {
      setIsCalculating(false);
    }
  }

  function handleNewTrial() {
    const trial = createTrial();
    setTrials((prev) => upsertTrial(prev, trial));
    setActiveId(trial.id);
  }

  function handleDeleteTrial(id: string) {
    setTrials((prev) => deleteTrial(prev, id));
    if (activeId === id) {
      const remaining = trials.filter((t) => t.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  function handleUpdateTrial(updated: BlendTrial) {
    setTrials((prev) => upsertTrial(prev, updated));
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex gap-6">
        {/* ── Sidebar: trial list ── */}
        <aside className="w-56 shrink-0 space-y-2">
          <button
            onClick={handleNewTrial}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
          >
            <Plus size={15} />
            New Trial
          </button>

          {trials.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No trials yet.</p>
          )}

          {trials.map((trial) => (
            <div
              key={trial.id}
              className={`group relative rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                trial.id === activeId
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setActiveId(trial.id)}
            >
              <p className={`text-sm font-medium truncate ${trial.id === activeId ? 'text-amber-900' : 'text-slate-800'}`}>
                {trial.name.trim() || <span className="italic text-slate-400">Unnamed</span>}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {trial.components.length} component{trial.components.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTrial(trial.id); }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                title="Delete trial"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </aside>

        {/* ── Main panel ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {!activeTrial && (
            <div className="text-center py-20 text-slate-400">
              <FlaskConical size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">
                {lotsLoading
                  ? 'Loading lots…'
                  : 'Create a new blend trial or select one from the sidebar.'}
              </p>
            </div>
          )}

          {activeTrial && (
            <>
              {/* Editor card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <BlendEditor
                  trial={activeTrial}
                  lots={lots}
                  inputMode={inputMode}
                  isCalculating={isCalculating}
                  onUpdateTrial={handleUpdateTrial}
                  onInputModeChange={setInputMode}
                  onCalculate={handleCalculate}
                />
              </div>

              {/* Report buttons */}
              {blendResult && blendResult.totalLitres > 0 && (
                <BlendReportButtons
                  trial={activeTrial}
                  result={blendResult}
                  onToast={setToast}
                />
              )}

              {/* Preview */}
              {blendResult && (
                <BlendPreview result={blendResult} />
              )}
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </main>
  );
}
