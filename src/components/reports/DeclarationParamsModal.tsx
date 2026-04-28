import { useState } from 'react';
import { X } from 'lucide-react';
import type { DeclarationParams } from '../../reports/types';

interface Props {
  lotNumber: string;
  lotName: string;
  onGenerate: (params: DeclarationParams) => void;
  onClose: () => void;
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 cursor-pointer">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          value ? 'bg-amber-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const empty = required && value.trim() === '';
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          empty
            ? 'border-red-300 bg-red-50'
            : 'border-slate-300 bg-white'
        }`}
      />
      {empty && <p className="text-xs text-red-500">Required</p>}
    </div>
  );
}

export function DeclarationParamsModal({ lotNumber, lotName, onGenerate, onClose }: Props) {
  const [compositionDataId, setCompositionDataId] = useState('');
  const [declarantName, setDeclarantName] = useState('');
  const [declarantTitle, setDeclarantTitle] = useState('');
  const [goodsDescription, setGoodsDescription] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showAllergens, setShowAllergens] = useState(true);
  const [showAppellation, setShowAppellation] = useState(true);
  const [showDetailedAppellation, setShowDetailedAppellation] = useState(true);
  const [showCulture, setShowCulture] = useState(true);
  const [showSwa, setShowSwa] = useState(true);
  const [compositionDecimals, setCompositionDecimals] = useState(4);

  const isValid =
    compositionDataId.trim() !== '' &&
    declarantName.trim() !== '' &&
    declarantTitle.trim() !== '' &&
    goodsDescription.trim() !== '';

  function handleGenerate() {
    if (!isValid) return;
    onGenerate({
      compositionDataId: compositionDataId.trim(),
      declarantName: declarantName.trim(),
      declarantTitle: declarantTitle.trim(),
      goodsDescription: goodsDescription.trim(),
      showAnalysis,
      showAllergens,
      showAppellation,
      showDetailedAppellation,
      showCulture,
      showSwa,
      compositionDecimals,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold text-slate-900">LIP Declaration Report</h2>
            <p className="text-xs text-slate-500 mt-0.5">{lotNumber} — {lotName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Required fields */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Required Information</p>
            <Field
              label="Composition Data ID"
              value={compositionDataId}
              onChange={setCompositionDataId}
              required
              placeholder="e.g. COMP-2024-001"
            />
            <Field
              label="Declarant Name"
              value={declarantName}
              onChange={setDeclarantName}
              required
              placeholder="Full name"
            />
            <Field
              label="Declarant Title"
              value={declarantTitle}
              onChange={setDeclarantTitle}
              required
              placeholder="e.g. Senior Winemaker"
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Goods Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={goodsDescription}
                onChange={(e) => setGoodsDescription(e.target.value)}
                rows={3}
                placeholder="Describe the goods being declared..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${
                  goodsDescription.trim() === ''
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 bg-white'
                }`}
              />
              {goodsDescription.trim() === '' && <p className="text-xs text-red-500">Required</p>}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Report Sections</p>
            <div className="bg-slate-50 rounded-xl px-4 py-1">
              <Toggle label="Show Analysis" value={showAnalysis} onChange={setShowAnalysis} />
              <Toggle label="Show Allergens & Additives" value={showAllergens} onChange={setShowAllergens} />
              <Toggle label="Show Appellation" value={showAppellation} onChange={setShowAppellation} />
              <Toggle label="Show Detailed Appellation" value={showDetailedAppellation} onChange={setShowDetailedAppellation} />
              <Toggle label="Show Culture & Sweetener" value={showCulture} onChange={setShowCulture} />
              <Toggle label="Show SWA Certification" value={showSwa} onChange={setShowSwa} />
            </div>
          </div>

          {/* Composition specificity */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Composition Specificity</p>
            <select
              value={compositionDecimals}
              onChange={(e) => setCompositionDecimals(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={1}>1 decimal place — &lt; 0.1% rolled into Other</option>
              <option value={2}>2 decimal places — &lt; 0.01% rolled into Other</option>
              <option value={3}>3 decimal places — &lt; 0.001% rolled into Other</option>
              <option value={4}>4 decimal places — &lt; 0.0001% rolled into Other</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {!isValid ? 'Complete all required fields to generate.' : 'Ready to generate.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!isValid}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
