import type { Lot } from '../../api/innovint';

interface Props {
  lot: Lot;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right max-w-xs">
        {value ?? <span className="text-slate-400 italic">—</span>}
      </span>
    </div>
  );
}

export function LotGeneralInfo({ lot }: Props) {
  return (
    <div>
      <InfoRow label="Lot Code" value={lot.code} />
      <InfoRow label="Lot Name" value={lot.name} />
      <InfoRow label="Colour" value={lot.color} />
      <InfoRow label="Style" value={lot.lotStyle} />
      <InfoRow
        label="Archived"
        value={
          lot.archived != null
            ? lot.archived ? 'Yes' : 'No'
            : undefined
        }
      />
    </div>
  );
}
