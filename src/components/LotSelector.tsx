import { useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import type { Lot } from '../api/innovint';
import { fetchLots } from '../api/innovint';
import { useAuth } from '../context/AuthContext';

// After apiGetAll unwraps .data, these fields are at the top level
function lotCode(lot: Lot): string | undefined {
  return lot.code;
}
function lotId(lot: Lot): string | undefined {
  return lot.id ?? (lot.internalId != null ? String(lot.internalId) : undefined);
}

interface LotSelectorProps {
  onLoad: (lotId: string) => void;
  currentLotId: string | null;
}

export function LotSelector({ onLoad, currentLotId }: LotSelectorProps) {
  const { token } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(currentLotId ?? '');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLots(token)
      .then((data) => {
        if (cancelled) return;
        if (data.length > 0) console.debug('[LotSelector] first lot item:', data[0]);
        // Sort by code alphabetically
        data.sort((a, b) => (lotCode(a) ?? '').localeCompare(lotCode(b) ?? ''));
        setLots(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Failed to load lots');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset search to show the selected label
        const sel = lots.find((l) => (lotId(l) ?? '') === selected);
        setSearch(sel ? (lotCode(sel) ?? '') : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [lots, selected]);

  function handleSelect(id: string, code: string) {
    console.debug('[LotSelector] selected lot id:', id);
    setSelected(id);
    setSearch(code);
    setOpen(false);
    if (id) onLoad(id);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setOpen(true);
  }

  function handleInputFocus() {
    setSearch('');
    setOpen(true);
  }

  const query = search.toLowerCase();
  const filtered = query
    ? lots.filter((l) => (lotCode(l) ?? '').toLowerCase().includes(query))
    : lots;

  function handleRetry() {
    setLots([]);
    setError(null);
    setLoading(true);
    if (!token) return;
    fetchLots(token)
      .then((data) => {
        data.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''));
        setLots(data);
      })
      .catch((err) => setError(err?.message ?? 'Failed to load lots'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label
            htmlFor="lotSelect"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Select Lot
          </label>
          <div className="relative" ref={containerRef}>
            <input
              id="lotSelect"
              type="text"
              value={search}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={loading || !!error}
              placeholder={
                loading
                  ? 'Loading lots…'
                  : error
                  ? 'Failed to load lots'
                  : `Search lots (${lots.length})…`
              }
              autoComplete="off"
              className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white disabled:bg-slate-50 disabled:text-slate-400"
            />
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            {open && !loading && !error && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-slate-400">No matches</li>
                ) : (
                  filtered.map((lot, i) => {
                    const id = lotId(lot) ?? '';
                    const code = lotCode(lot) ?? id;
                    return (
                      <li
                        key={id || i}
                        onMouseDown={() => handleSelect(id, code)}
                        className={`px-3 py-2 cursor-pointer hover:bg-amber-50 hover:text-amber-800 ${
                          id === selected ? 'bg-amber-50 font-medium text-amber-800' : 'text-slate-700'
                        }`}
                      >
                        {code}
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>

        {error && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-2 px-3 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
