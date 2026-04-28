import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  reportTitle: string;
  lotNumber: string;
  lotName: string;
  onGenerate: (decimals: number) => void;
  onClose: () => void;
}

const DECIMAL_OPTIONS = [
  { value: 1, label: '1 decimal place', description: 'Components < 0.1% rolled into Other' },
  { value: 2, label: '2 decimal places', description: 'Components < 0.01% rolled into Other' },
  { value: 3, label: '3 decimal places', description: 'Components < 0.001% rolled into Other' },
  { value: 4, label: '4 decimal places', description: 'Components < 0.0001% rolled into Other' },
];

export function CompositionDecimalsModal({ reportTitle, lotNumber, lotName, onGenerate, onClose }: Props) {
  const [decimals, setDecimals] = useState(4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold text-slate-900">{reportTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{lotNumber} — {lotName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Composition Specificity
          </p>
          <div className="space-y-2">
            {DECIMAL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  decimals === opt.value
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="decimals"
                  value={opt.value}
                  checked={decimals === opt.value}
                  onChange={() => setDecimals(opt.value)}
                  className="mt-0.5 accent-amber-600 shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(decimals)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
          >
            Generate PDF
          </button>
        </div>

      </div>
    </div>
  );
}
