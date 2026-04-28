// Shared formatting helpers for pdfmake report generators.

import type { Additive, Analysis, AppellationRow, VarietalRow, VintageRow } from '../api/innovint';

// ─── Formatters ───────────────────────────────────────────────────────────────

export function fmtPct(v: number, decimals = 4): string {
  return v.toFixed(decimals) + '%';
}

export function fmtVintage(vintage?: number | string | null): string {
  if (vintage == null) return '—';
  return String(vintage) === '1900' ? 'NV' : String(vintage);
}

export function fmtL(v: number | undefined): string {
  if (v == null) return '—';
  return (
    new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v) + ' L'
  );
}

export function fmtDate(raw: string | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayStr(): string {
  return new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function nowStr(): string {
  return new Date().toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Percentage normaliser ────────────────────────────────────────────────────

export function toPct(row: { percentage?: number; percent?: number }): number {
  const raw = row.percentage ?? row.percent ?? 0;
  return raw > 1 ? raw : raw * 100;
}

export function toLitres(row: VintageRow | VarietalRow | AppellationRow, totalLitres?: number): number | undefined {
  const v = row.liters ?? row.litres;
  if (v != null) return Number(v);
  if (totalLitres != null) {
    const raw = row.percentage ?? row.percent ?? 0;
    const frac = raw > 1 ? raw / 100 : raw;
    return frac * totalLitres;
  }
  return undefined;
}

// ─── Additive helpers ─────────────────────────────────────────────────────────

const NON_ALLERGEN = new Set(['vegan', 'organic']);

export function resolveAdditiveName(a: Additive, productMap: Record<string, string>): string {
  const refId = String(a.additiveId ?? a.id ?? '');
  if (refId && productMap[refId]) return productMap[refId];
  return String(a.name ?? a.additiveName ?? (refId || '—'));
}

export function resolveIndicatorNames(a: Additive, indicatorMap: Record<string, string>): string[] {
  const embedded = (a as Record<string, unknown>).indicators;
  if (Array.isArray(embedded) && embedded.length > 0) {
    const names = embedded.map((ind: unknown) => {
      if (!ind || typeof ind !== 'object') return String(ind ?? '');
      const i = ind as Record<string, unknown>;
      const id = String(i.id ?? '');
      return (id && indicatorMap[id]) ? indicatorMap[id] : String(i.name ?? i.abbreviation ?? id ?? '');
    }).filter(Boolean);
    if (names.length > 0) return names;
  }
  if (Array.isArray(a.indicatorIds) && a.indicatorIds.length > 0) {
    return a.indicatorIds.map((id) => indicatorMap[String(id)] ?? String(id));
  }
  return [];
}

export function isAllergen(a: Additive, indicatorNames: string[]): boolean {
  if (indicatorNames.length > 0) return indicatorNames.some((n) => !NON_ALLERGEN.has(n.toLowerCase()));
  if (a.isAllergen != null) return Boolean(a.isAllergen);
  if (a.allergen != null) return Boolean(a.allergen);
  return false;
}

export function resolveAmount(a: Additive): { value: string; unit: string } {
  const raw = a.amount;
  if (raw == null) return { value: '—', unit: '—' };
  if (typeof raw === 'object') {
    return { value: raw.value != null ? String(raw.value) : '—', unit: raw.unit ?? '—' };
  }
  return { value: String(raw), unit: String(a.unitOfMeasure ?? a.uom ?? '—') };
}

// ─── Analysis helpers ─────────────────────────────────────────────────────────

export function resolveAnalysisName(a: Analysis): string {
  const type = a.analysisType;
  if (type) return String(type.name ?? type.abbreviation ?? '—');
  return String(a.name ?? (a as Record<string, unknown>).analysisName ?? '—');
}

export function resolveAnalysisValue(a: Analysis): string {
  const v = a.value ?? (a as Record<string, unknown>).result;
  return v != null ? String(v) : '—';
}

export function resolveAnalysisUnit(a: Analysis): string {
  if (a.unit?.unit) return a.unit.unit;
  const type = a.analysisType;
  if (type?.unit) return String(type.unit);
  return String(a.unitOfMeasure ?? a.uom ?? '—');
}

export function resolveAnalysisDate(a: Analysis): string | undefined {
  return a.recordedAt ?? a.date ?? a.analysisDate ?? a.createdAt;
}

export function dedupeAnalyses(analyses: Analysis[]): Analysis[] {
  const latestByType = new Map<string, Analysis>();
  for (const a of analyses) {
    const key = resolveAnalysisName(a);
    const existing = latestByType.get(key);
    if (!existing) { latestByType.set(key, a); continue; }
    const ta = new Date(resolveAnalysisDate(a) ?? '').getTime() || 0;
    const te = new Date(resolveAnalysisDate(existing) ?? '').getTime() || 0;
    if (ta > te) latestByType.set(key, a);
  }
  return [...latestByType.values()].sort((a, b) => {
    const ta = new Date(resolveAnalysisDate(a) ?? '').getTime() || 0;
    const tb = new Date(resolveAnalysisDate(b) ?? '').getTime() || 0;
    return tb - ta;
  });
}

// ─── pdfmake primitives ────────────────────────────────────────────────────────

export const COLORS = {
  dark: '#1e293b',
  medium: '#475569',
  light: '#94a3b8',
  border: '#e2e8f0',
  rowAlt: '#f8fafc',
  accent: '#1e3a8a',
  red: '#dc2626',
  redBg: '#fff0f0',
  amber: '#92400e',
  amberBg: '#fffbeb',
  green: '#15803d',
  greenBg: '#f0fdf4',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Cell = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Content = any;

export function sectionHeading(text: string): Content {
  return [
    { text: text.toUpperCase(), bold: true, fontSize: 10, color: COLORS.accent, margin: [0, 14, 0, 2] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLORS.border }], margin: [0, 0, 0, 6] },
  ];
}

export function kvRow(label: string, value: string, i = 0): Cell[] {
  return [
    { text: label, bold: true, color: COLORS.medium, fontSize: 9, fillColor: i % 2 === 0 ? null : COLORS.rowAlt },
    { text: value, fontSize: 9, color: COLORS.dark, fillColor: i % 2 === 0 ? null : COLORS.rowAlt },
  ];
}

export function tableHeader(...labels: string[]): Cell[] {
  return labels.map((l) => ({
    text: l, bold: true, fontSize: 8, color: COLORS.medium,
    fillColor: '#f1f5f9', margin: [3, 4, 3, 4],
  }));
}

export function dataCell(text: string, i: number, opts: Cell = {}): Cell {
  return {
    text, fontSize: 9, color: COLORS.dark,
    fillColor: i % 2 === 0 ? null : COLORS.rowAlt,
    margin: [3, 3, 3, 3],
    ...opts,
  };
}

export function allergenCell(text: string, isAllergenVal: boolean, i: number): Cell {
  return {
    text, fontSize: 9,
    bold: isAllergenVal,
    color: isAllergenVal ? COLORS.red : COLORS.dark,
    fillColor: isAllergenVal ? COLORS.redBg : (i % 2 === 0 ? null : COLORS.rowAlt),
    margin: [3, 3, 3, 3],
  };
}

export function warningBox(text: string, color: 'amber' | 'red' = 'amber'): Content {
  return {
    table: {
      widths: ['*'],
      body: [[{
        text,
        fontSize: 9,
        color: color === 'amber' ? COLORS.amber : COLORS.red,
        bold: true,
        fillColor: color === 'amber' ? COLORS.amberBg : COLORS.redBg,
        margin: [8, 6, 8, 6],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 4, 0, 8],
  };
}

export function pageHeader(
  companyName: string,
  reportTitle: string,
  generated: string,
  lotNumber: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (currentPage: number) => any {
  return () => ({
    margin: [40, 16, 40, 0],
    stack: [
      {
        columns: [
          { text: companyName, bold: true, fontSize: 10, color: COLORS.accent },
          { text: reportTitle, bold: true, fontSize: 10, color: COLORS.dark, alignment: 'center' },
          { text: generated, fontSize: 8, color: COLORS.light, alignment: 'right' },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 0.5, lineColor: COLORS.border }] },
      { text: `Lot: ${lotNumber}`, fontSize: 8, color: COLORS.medium, margin: [0, 3, 0, 0] },
    ],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pageFooter(footerText: string): (currentPage: number, pageCount: number) => any {
  return (currentPage, pageCount) => ({
    margin: [40, 8, 40, 0],
    columns: [
      { text: footerText, fontSize: 7, color: COLORS.light },
      { text: `Page ${currentPage} of ${pageCount}`, fontSize: 7, color: COLORS.light, alignment: 'right' },
    ],
  });
}

// ─── Shared section builders ──────────────────────────────────────────────────

export function buildVarietalTable(
  varietals: VarietalRow[],
  varietalMap: Record<string, string>,
  totalLitres?: number,
  decimals = 4,
): Content {
  if (!varietals.length) return { text: 'No varietal data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] };
  const threshold = Math.pow(10, -decimals);
  const big = varietals.filter((v) => toPct(v) >= threshold);
  const small = varietals.filter((v) => toPct(v) < threshold);
  const rows = big.map((v, i) => {
    const id = String(v.varietalId ?? v.id ?? '');
    const name = varietalMap[id] ?? v.name ?? (id || 'Unknown');
    const pct = toPct(v);
    const litres = toLitres(v, totalLitres);
    return [
      dataCell(name, i),
      dataCell(fmtPct(pct, decimals), i, { alignment: 'right' }),
      dataCell(fmtL(litres), i, { alignment: 'right' }),
    ];
  });
  if (small.length > 0) {
    const otherPct = small.reduce((s, v) => s + toPct(v), 0);
    const otherL = small.reduce((s, v) => s + (toLitres(v, totalLitres) ?? 0), 0);
    const i = big.length;
    rows.push([
      dataCell('Other', i),
      dataCell(fmtPct(otherPct, decimals), i, { alignment: 'right' }),
      dataCell(fmtL(otherL > 0 ? otherL : undefined), i, { alignment: 'right' }),
    ]);
  }
  const totalPct = varietals.reduce((s, v) => s + toPct(v), 0);
  const totalL = varietals.reduce((s, v) => s + (toLitres(v, totalLitres) ?? 0), 0);
  return {
    table: {
      headerRows: 1,
      widths: ['*', 60, 80],
      body: [
        tableHeader('Varietal Name', '%', 'Litres'),
        ...rows,
        [
          { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
          { text: fmtPct(totalPct, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
          { text: fmtL(totalL), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
        ],
      ],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  };
}

export function buildVintageTable(
  vintages: VintageRow[],
  totalLitres?: number,
  decimals = 4,
): Content {
  if (!vintages.length) return { text: 'No vintage data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] };
  const threshold = Math.pow(10, -decimals);
  const big = vintages.filter((v) => toPct(v) >= threshold);
  const small = vintages.filter((v) => toPct(v) < threshold);
  const rows = big.map((v, i) => {
    const year = fmtVintage(v.vintage ?? v.year);
    const pct = toPct(v);
    const litres = toLitres(v, totalLitres);
    return [
      dataCell(year, i),
      dataCell(fmtPct(pct, decimals), i, { alignment: 'right' }),
      dataCell(fmtL(litres), i, { alignment: 'right' }),
    ];
  });
  if (small.length > 0) {
    const otherPct = small.reduce((s, v) => s + toPct(v), 0);
    const otherL = small.reduce((s, v) => s + (toLitres(v, totalLitres) ?? 0), 0);
    const i = big.length;
    rows.push([
      dataCell('Other', i),
      dataCell(fmtPct(otherPct, decimals), i, { alignment: 'right' }),
      dataCell(fmtL(otherL > 0 ? otherL : undefined), i, { alignment: 'right' }),
    ]);
  }
  const totalPct = vintages.reduce((s, v) => s + toPct(v), 0);
  const totalL = vintages.reduce((s, v) => s + (toLitres(v, totalLitres) ?? 0), 0);
  return {
    table: {
      headerRows: 1,
      widths: ['*', 60, 80],
      body: [
        tableHeader('Vintage Year', '%', 'Litres'),
        ...rows,
        [
          { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
          { text: fmtPct(totalPct, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
          { text: fmtL(totalL), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
        ],
      ],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  };
}

export function buildAppellationSummary(
  appellations: AppellationRow[],
  appellationMap: Record<string, string>,
  decimals = 4,
): Content {
  if (!appellations.length) return null;
  const top = appellations[0];
  const id = String(top.appellationId ?? top.id ?? '');
  const name = appellationMap[id] ?? top.name ?? (id || 'Unknown');
  const pct = toPct(top);
  return {
    text: `${name} — ${fmtPct(pct, decimals)}`,
    bold: true, fontSize: 10, color: COLORS.accent, margin: [0, 2, 0, 8],
  };
}

const GI_LEVEL_NAMES: Record<number, string> = {
  1: 'Sub-Region', 2: 'Region', 3: 'State', 4: 'Zone', 5: 'Country',
};

export function buildDetailedAppellationTable(
  appellations: AppellationRow[],
  appellationMap: Record<string, string>,
  totalLitres?: number,
  showValidation = false,
  decimals = 4,
): Content {
  if (!appellations.length) return { text: 'No appellation data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] };

  // Collect all levels from subAppellations
  interface LevelRow { level: number; id: string; name: string; pct: number; litres?: number }
  const levelRows: LevelRow[] = [];

  appellations.forEach((app) => {
    const id = String(app.appellationId ?? app.id ?? '');
    const name = appellationMap[id] ?? app.name ?? (id || 'Unknown');
    levelRows.push({ level: 1, id, name, pct: toPct(app), litres: toLitres(app, totalLitres) });

    const subs = (app.subAppellations ?? []) as AppellationRow[];
    subs.forEach((sub, si) => {
      const sid = String(sub.appellationId ?? sub.id ?? '');
      const sname = appellationMap[sid] ?? sub.name ?? (sid || 'Unknown');
      levelRows.push({ level: si + 2, id: sid, name: sname, pct: toPct(sub), litres: toLitres(sub, totalLitres) });
    });
  });

  const widths = showValidation ? [30, 80, '*', 60, 80, 60] : [30, 80, '*', 60, 80];
  const headers = showValidation
    ? tableHeader('Level', 'Level Name', 'Appellation', '%', 'Litres', 'Totals 100%?')
    : tableHeader('Level', 'Level Name', 'Appellation', '%', 'Litres');

  // Group by level for validation
  const byLevel: Record<number, LevelRow[]> = {};
  levelRows.forEach((r) => { (byLevel[r.level] = byLevel[r.level] ?? []).push(r); });

  const rows = levelRows.map((r, i) => {
    const levelTotal = (byLevel[r.level] ?? []).reduce((s, lr) => s + lr.pct, 0);
    const ok = Math.abs(levelTotal - 100) < 0.1;
    const base = [
      dataCell(`L${r.level}`, i),
      dataCell(GI_LEVEL_NAMES[r.level] ?? `Level ${r.level}`, i),
      dataCell(r.name, i),
      dataCell(fmtPct(r.pct, decimals), i, { alignment: 'right' }),
      dataCell(fmtL(r.litres), i, { alignment: 'right' }),
    ];
    if (showValidation) {
      base.push({
        text: ok ? '✓' : '✗',
        fontSize: 9, bold: true,
        color: ok ? COLORS.green : COLORS.red,
        fillColor: i % 2 === 0 ? null : COLORS.rowAlt,
        alignment: 'center', margin: [3, 3, 3, 3],
      });
    }
    return base;
  });

  return {
    table: { headerRows: 1, widths, body: [headers, ...rows] },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  };
}

export function buildAnalysesTable(analyses: Analysis[]): Content {
  const deduped = dedupeAnalyses(analyses);
  if (!deduped.length) return { text: 'No laboratory analysis recorded for this lot.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] };
  const rows = deduped.map((a, i) => [
    dataCell(resolveAnalysisName(a), i),
    dataCell(resolveAnalysisValue(a), i, { alignment: 'right' }),
    dataCell(resolveAnalysisUnit(a), i),
    dataCell(fmtDate(resolveAnalysisDate(a)), i),
  ]);
  return {
    table: {
      headerRows: 1,
      widths: ['*', 60, 60, 80],
      body: [tableHeader('Analysis Name', 'Value', 'UOM', 'Date'), ...rows],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  };
}

export function buildAdditivesTable(
  additives: Additive[],
  productMap: Record<string, string>,
  indicatorMap: Record<string, string>,
): Content {
  if (!additives.length) return { text: 'No additives recorded for this lot.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] };
  const rows = additives.map((a, i) => {
    const name = resolveAdditiveName(a, productMap);
    const { value, unit } = resolveAmount(a);
    const indicators = resolveIndicatorNames(a, indicatorMap);
    const allergen = isAllergen(a, indicators);
    const rowFill = allergen ? COLORS.redBg : (i % 2 === 0 ? null : COLORS.rowAlt);
    const cell = (text: string, opts: Cell = {}): Cell => ({
      text, fontSize: 9, color: COLORS.dark, fillColor: rowFill, margin: [3, 3, 3, 3], ...opts,
    });
    return [
      cell(name),
      cell(String(a.batchNumber ?? '—')),
      cell(value, { alignment: 'right' }),
      cell(unit),
      { text: allergen ? '⚠ Yes' : 'No', fontSize: 9, bold: allergen, color: allergen ? COLORS.red : COLORS.dark, fillColor: rowFill, margin: [3, 3, 3, 3] },
    ];
  });
  return {
    table: {
      headerRows: 1,
      widths: ['*', 80, 50, 50, 55],
      body: [tableHeader('Additive Name', 'Batch No.', 'Amount', 'Unit', 'Allergen'), ...rows],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  };
}

export function buildVeganStatus(isVegan: boolean | null | undefined): Content {
  if (isVegan == null) return { text: '— Vegan status not recorded', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] };
  return {
    text: isVegan ? '✓ Vegan Friendly' : '✗ Not Vegan Friendly',
    fontSize: 10,
    bold: true,
    color: isVegan ? COLORS.green : COLORS.red,
    margin: [0, 2, 0, 8],
  };
}

export function buildLotSummaryTable(
  lotNumber: string,
  _lotName: string,
  vesselName: string,
  totalLitres: number | undefined,
  vesselCapacity: number | undefined,
): Content {
  const ullage = vesselCapacity != null && totalLitres != null ? vesselCapacity - totalLitres : undefined;
  const ullageStr = ullage != null ? fmtL(ullage) : '—';
  const ullageWarning = ullage != null && ullage < 0;

  const rows = [
    kvRow('Lot Number', lotNumber, 0),
    kvRow('Vessel', vesselName, 1),
    kvRow('Total Litres', fmtL(totalLitres), 2),
    kvRow('Vessel Capacity', vesselCapacity != null ? fmtL(vesselCapacity) : '—', 3),
    [
      { text: 'Ullage', bold: true, color: COLORS.medium, fontSize: 9, fillColor: COLORS.rowAlt },
      { text: ullageStr, fontSize: 9, color: ullageWarning ? COLORS.red : COLORS.dark, bold: ullageWarning, fillColor: ullageWarning ? COLORS.redBg : COLORS.rowAlt },
    ],
  ];

  const content: Content[] = [
    {
      table: { widths: [120, '*'], body: rows },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    },
  ];

  if (ullageWarning) {
    content.push(warningBox('⚠ Warning: Vessel appears overfilled (ullage is negative). Verify volume before dispatch.', 'amber'));
  }

  return content;
}

export function buildMakeUpTable(
  juiceWinePercent: number | undefined,
  juiceWineLitres: number | undefined,
  culturePercent: number | undefined,
  cultureLitres: number | undefined,
  totalLitres: number | undefined,
  decimals = 4,
): Content {
  const rows = [
    [
      dataCell('Juice / Wine', 0),
      dataCell(juiceWinePercent != null ? fmtPct(juiceWinePercent, decimals) : '—', 0, { alignment: 'right' }),
      dataCell(fmtL(juiceWineLitres), 0, { alignment: 'right' }),
    ],
    [
      dataCell('Culture / Sweetener', 1),
      dataCell(culturePercent != null ? fmtPct(culturePercent, decimals) : '—', 1, { alignment: 'right' }),
      dataCell(fmtL(cultureLitres), 1, { alignment: 'right' }),
    ],
    [
      { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtPct(100, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtL(totalLitres), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
    ],
  ];
  return {
    table: { headerRows: 1, widths: ['*', 80, 100], body: [tableHeader('Component', '%', 'Litres'), ...rows] },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  };
}
