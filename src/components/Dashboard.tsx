import { useState, useCallback } from 'react';
import { Wine, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReferenceData } from '../context/ReferenceDataContext';
import type { ComponentsSummary, Additive, Analysis, Lot, BlockComponent, Bond, LotMakeup } from '../api/innovint';
import { toL } from '../utils/format';
import {
  fetchComponentsSummary,
  fetchAdditives,
  fetchAnalyses,
  fetchLot,
  fetchBlockComponents,
  fetchBlock,
  fetchBond,
  fetchLotMakeup,
  InnoVintError,
} from '../api/innovint';
import { LotSelector } from './LotSelector';
import { ReportButtons } from './ReportButtons';
import { SectionCard } from './SectionCard';
import { LotGeneralInfo } from './sections/LotGeneralInfo';
import { JuiceWineComposition } from './sections/JuiceWineComposition';
import { LotMakeupView } from './sections/LotMakeupView';
import { BlockComponents } from './sections/BlockComponents';
import { AdditivesAllergens } from './sections/AdditivesAllergens';
import { LabAnalysis } from './sections/LabAnalysis';
import { SectionSkeleton, TableSkeleton } from './Skeleton';
import { ErrorState } from './ErrorState';
import { Toast } from './Toast';

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; endpoint?: string };

export function Dashboard() {
  const { token, setToken } = useAuth();
  const { loading: refLoading, error: refError, reload: refReload } = useReferenceData();

  const [lotId, setLotId] = useState<string | null>(null);
  const [lotDetail, setLotDetail] = useState<LoadState<Lot>>({ status: 'idle' });
  const [bond, setBond] = useState<Bond | null>(null);
  const [summary, setSummary] = useState<LoadState<ComponentsSummary>>({ status: 'idle' });
  const [additives, setAdditives] = useState<LoadState<Additive[]>>({ status: 'idle' });
  const [analyses, setAnalyses] = useState<LoadState<Analysis[]>>({ status: 'idle' });
  const [blockComponents, setBlockComponents] = useState<LoadState<BlockComponent[]>>({ status: 'idle' });
  const [makeup, setMakeup] = useState<LoadState<LotMakeup>>({ status: 'idle' });
  const [blockTags, setBlockTags] = useState<Record<string, string[]>>({});
  const [compositionView, setCompositionView] = useState<'juicewine' | 'makeup'>('juicewine');
  const [toast, setToast] = useState<string | null>(null);

  function errMsg(err: unknown, fallback: string): { message: string; endpoint?: string } {
    if (err instanceof InnoVintError) return { message: err.message, endpoint: err.endpoint };
    return { message: err instanceof Error ? err.message : fallback };
  }

  const loadLotDetail = useCallback(async (id: string) => {
    if (!token) return;
    setLotDetail({ status: 'loading' });
    setMakeup({ status: 'idle' });
    setBond(null);
    try {
      const data = await fetchLot(token, id);
      setLotDetail({ status: 'success', data });
      if (data.bondId) {
        fetchBond(token, data.bondId).then(setBond).catch(() => {});
      }
      if (data.code) {
        setMakeup({ status: 'loading' });
        fetchLotMakeup(token, data.code)
          .then((m) => setMakeup({ status: 'success', data: m }))
          .catch((err) => {
            const { message, endpoint } = errMsg(err, 'Failed to load lot makeup');
            setMakeup({ status: 'error', message, endpoint });
          });
      }
    } catch (err) {
      const { message, endpoint } = errMsg(err, 'Failed to load lot detail');
      setLotDetail({ status: 'error', message, endpoint });
    }
  }, [token]);

  const loadSummary = useCallback(async (id: string) => {
    if (!token) return;
    setSummary({ status: 'loading' });
    try {
      const data = await fetchComponentsSummary(token, id);
      setSummary({ status: 'success', data });
    } catch (err) {
      const { message, endpoint } = errMsg(err, 'Failed to load composition summary');
      setSummary({ status: 'error', message, endpoint });
    }
  }, [token]);

  const loadAdditives = useCallback(async (id: string) => {
    if (!token) return;
    setAdditives({ status: 'loading' });
    try {
      const data = await fetchAdditives(token, id);
      setAdditives({ status: 'success', data });
    } catch (err) {
      const { message, endpoint } = errMsg(err, 'Failed to load additives');
      setAdditives({ status: 'error', message, endpoint });
    }
  }, [token]);

  const loadBlockComponents = useCallback(async (id: string) => {
    if (!token) return;
    setBlockComponents({ status: 'loading' });
    setBlockTags({});
    try {
      const data = await fetchBlockComponents(token, id);
      setBlockComponents({ status: 'success', data });
      const uniqueIds = [...new Set(data.map((r) => r.block?.id).filter((bid): bid is string => !!bid))];
      Promise.all(
        uniqueIds.map((blockId) =>
          fetchBlock(token, blockId)
            .then((b) => ({ id: blockId, tags: (b.tags ?? []) as string[] }))
            .catch(() => ({ id: blockId, tags: [] as string[] }))
        )
      ).then((results) => {
        const map: Record<string, string[]> = {};
        results.forEach(({ id: blockId, tags }) => { map[blockId] = tags; });
        setBlockTags(map);
      });
    } catch (err) {
      const { message, endpoint } = errMsg(err, 'Failed to load block components');
      setBlockComponents({ status: 'error', message, endpoint });
    }
  }, [token]);

  const loadAnalyses = useCallback(async (id: string) => {
    if (!token) return;
    setAnalyses({ status: 'loading' });
    try {
      const data = await fetchAnalyses(token, id);
      // Filter out soft-deleted analyses
      const live = data.filter((a) => !a.deleted);
      setAnalyses({ status: 'success', data: live });
    } catch (err) {
      const { message, endpoint } = errMsg(err, 'Failed to load lab analyses');
      setAnalyses({ status: 'error', message, endpoint });
    }
  }, [token]);

  function handleLoadLot(id: string) {
    setLotId(id);
    setBond(null);
    loadLotDetail(id);
    loadSummary(id);
    loadBlockComponents(id);
    loadAdditives(id);
    loadAnalyses(id);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-1.5 rounded-lg">
              <Wine className="text-white" size={18} />
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm">AVL Wines</span>
              <span className="text-slate-400 text-sm mx-2">|</span>
              <span className="text-slate-600 text-sm">LIP Dashboard</span>
            </div>
          </div>
          <button
            onClick={() => setToken(null)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <LogOut size={15} />
            Change Token
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {refLoading && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
            <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading reference data (varietals &amp; appellations)…
          </div>
        )}
        {refError && (
          <ErrorState message={`Reference data failed: ${refError}`} onRetry={refReload} />
        )}

        <LotSelector onLoad={handleLoadLot} currentLotId={lotId} />
        <ReportButtons
          lotId={lotId}
          lot={lotDetail.status === 'success' ? lotDetail.data : null}
          bond={bond}
          summary={summary.status === 'success' ? summary.data : null}
          makeup={makeup.status === 'success' ? makeup.data : null}
          additives={additives.status === 'success' ? additives.data : null}
          analyses={analyses.status === 'success' ? analyses.data : null}
          blockComponents={blockComponents.status === 'success' ? blockComponents.data : null}
          blockTags={blockTags}
          onToast={(msg) => setToast(msg)}
        />

        {lotId && (
          <>
            {/* ── Section 1: Lot Composition ── */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                1 — Lot Composition Summary
              </h2>

              <SectionCard title="Lot General Info">
                {lotDetail.status === 'loading' && <SectionSkeleton />}
                {lotDetail.status === 'error' && (
                  <ErrorState message={lotDetail.message} endpoint={lotDetail.endpoint} onRetry={() => loadLotDetail(lotId)} />
                )}
                {lotDetail.status === 'success' && <LotGeneralInfo lot={lotDetail.data} />}
              </SectionCard>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setCompositionView('juicewine')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    compositionView === 'juicewine'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Juice / Wine Components
                </button>
                <button
                  onClick={() => setCompositionView('makeup')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    compositionView === 'makeup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Lot Makeup
                </button>
              </div>

              {compositionView === 'juicewine' && (
                <SectionCard title="Juice / Wine Composition">
                  {summary.status === 'loading' && <SectionSkeleton />}
                  {summary.status === 'error' && (
                    <ErrorState message={summary.message} endpoint={summary.endpoint} onRetry={() => loadSummary(lotId)} />
                  )}
                  {summary.status === 'success' && (
                    <JuiceWineComposition
                      data={summary.data}
                      totalLitres={lotDetail.status === 'success' ? toL(lotDetail.data.volume) : undefined}
                    />
                  )}
                </SectionCard>
              )}

              {compositionView === 'makeup' && (
                <SectionCard title="Lot Makeup">
                  {makeup.status === 'idle' && (
                    <p className="text-sm text-slate-400 italic">Waiting for lot code…</p>
                  )}
                  {makeup.status === 'loading' && <SectionSkeleton />}
                  {makeup.status === 'error' && (
                    <ErrorState message={makeup.message} endpoint={makeup.endpoint} onRetry={() => {
                      if (lotDetail.status === 'success' && lotDetail.data.code) {
                        setMakeup({ status: 'loading' });
                        fetchLotMakeup(token!, lotDetail.data.code)
                          .then((m) => setMakeup({ status: 'success', data: m }))
                          .catch((err) => {
                            const { message, endpoint } = errMsg(err, 'Failed to load lot makeup');
                            setMakeup({ status: 'error', message, endpoint });
                          });
                      }
                    }} />
                  )}
                  {makeup.status === 'success' && <LotMakeupView data={makeup.data} />}
                </SectionCard>
              )}

              <SectionCard title="Vineyard & Blocks">
                {blockComponents.status === 'loading' && <TableSkeleton />}
                {blockComponents.status === 'error' && (
                  <ErrorState message={blockComponents.message} endpoint={blockComponents.endpoint} onRetry={() => loadBlockComponents(lotId)} />
                )}
                {blockComponents.status === 'success' && <BlockComponents data={blockComponents.data} blockTags={blockTags} />}
              </SectionCard>
            </div>

            {/* ── Section 2: Additives & Allergens ── */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                2 — Additives &amp; Allergens
              </h2>
              <SectionCard
                title="Additives"
                badge={
                  additives.status === 'success' ? (
                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {additives.data.length}
                    </span>
                  ) : undefined
                }
              >
                {additives.status === 'loading' && <TableSkeleton />}
                {additives.status === 'error' && (
                  <ErrorState message={additives.message} endpoint={additives.endpoint} onRetry={() => loadAdditives(lotId)} />
                )}
                {additives.status === 'success' && <AdditivesAllergens data={additives.data} />}
              </SectionCard>
            </div>

            {/* ── Section 3: Lab Analysis ── */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                3 — Laboratory Analysis
              </h2>
              <SectionCard
                title="Analyses"
                badge={
                  analyses.status === 'success' ? (
                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {analyses.data.length}
                    </span>
                  ) : undefined
                }
              >
                {analyses.status === 'loading' && <TableSkeleton rows={8} />}
                {analyses.status === 'error' && (
                  <ErrorState message={analyses.message} endpoint={analyses.endpoint} onRetry={() => loadAnalyses(lotId)} />
                )}
                {analyses.status === 'success' && <LabAnalysis data={analyses.data} />}
              </SectionCard>
            </div>
          </>
        )}

        {!lotId && (
          <div className="text-center py-20 text-slate-400">
            <Wine size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Select a lot above to load data.</p>
          </div>
        )}
      </main>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
