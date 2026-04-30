import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Lot } from '../../api/innovint';

function lotId(lot: Lot): string {
  return lot.id ?? (lot.internalId != null ? String(lot.internalId) : '');
}

interface Props {
  lots: Lot[];
  selectedLotId: string;
  onSelect: (lotId: string, lotCode: string) => void;
  disabled?: boolean;
}

export function LotPicker({ lots, selectedLotId, onSelect, disabled }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLot = lots.find((l) => lotId(l) === selectedLotId);

  // Keep search display in sync with selection when closed
  useEffect(() => {
    if (!open) {
      setSearch(selectedLot?.code ?? '');
    }
  }, [open, selectedLot]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = search.toLowerCase();
  const filtered = open && query
    ? lots.filter((l) => (l.code ?? '').toLowerCase().includes(query))
    : lots;

  function handleSelect(lot: Lot) {
    const id = lotId(lot);
    const code = lot.code ?? id;
    setSearch(code);
    setOpen(false);
    onSelect(id, code);
  }

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      <input
        type="text"
        value={open ? search : (selectedLot?.code ?? '')}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => { setSearch(''); setOpen(true); }}
        disabled={disabled}
        placeholder="Select lot…"
        autoComplete="off"
        className="w-full px-3 py-1.5 pr-7 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white disabled:bg-slate-50 disabled:text-slate-400"
      />
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-slate-400">No matches</li>
          ) : (
            filtered.map((lot) => {
              const id = lotId(lot);
              return (
                <li
                  key={id}
                  onMouseDown={() => handleSelect(lot)}
                  className={`px-3 py-1.5 cursor-pointer hover:bg-amber-50 hover:text-amber-800 ${
                    id === selectedLotId ? 'bg-amber-50 font-medium text-amber-800' : 'text-slate-700'
                  }`}
                >
                  {lot.code ?? id}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
