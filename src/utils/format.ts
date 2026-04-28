/** Convert a volume object { value, unit } to litres */
export function toL(vol: { value?: number; unit?: string } | undefined): number | undefined {
  if (!vol || vol.value == null) return undefined;
  const v = vol.value;
  switch ((vol.unit ?? '').toLowerCase()) {
    case 'gal': case 'gallon': case 'gallons': return v * 3.78541;
    case 'hl': case 'hectolitre': case 'hectoliter': return v * 100;
    case 'ml': return v * 0.001;
    default: return v; // assume litres
  }
}

/** Format a percentage to 4 decimal places */
export function fmtPct(value: number): string {
  return value.toFixed(4);
}

/** Format a vintage year, replacing 1900 with "NV" (non-vintage) */
export function fmtVintage(vintage?: number | string | null, fallback = '—'): string {
  if (vintage == null) return fallback;
  return String(vintage) === '1900' ? 'NV' : String(vintage);
}

/** Format litres with comma thousands separator and 2 decimal places */
export function fmtLitres(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
