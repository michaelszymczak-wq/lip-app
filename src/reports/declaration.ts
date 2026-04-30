import { getPdfMake } from './pdfSetup';
import type { DeclarationReportData } from './types';
import {
  nowStr, todayStr, fmtPct, fmtL,
  sectionHeading, kvRow, tableHeader, dataCell,
  pageHeader, pageFooter, COLORS,
  buildVarietalVintageColumns,
  buildAppellationSummary, buildDetailedAppellationTable,
  buildAnalysesTable, buildAdditivesTable, buildVeganStatus,
  type Content,
} from './pdfHelpers';

export type { DeclarationReportData };

export async function generateDeclarationReport(data: DeclarationReportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const { params } = data;
  const decimals = params.compositionDecimals;
  const generated = nowStr();
  const today = todayStr();

  // ─── Composition summary rows ─────────────────────────────────────────────

  const compRows = [
    [
      dataCell('Juice / Wine', 0),
      dataCell(data.juiceWinePercent != null ? fmtPct(data.juiceWinePercent, decimals) : '—', 0, { alignment: 'right' }),
      dataCell(fmtL(data.juiceWineLitres), 0, { alignment: 'right' }),
    ],
    [
      dataCell('Culture / Sweetener', 1),
      dataCell(data.culturePercent != null ? fmtPct(data.culturePercent, decimals) : '—', 1, { alignment: 'right' }),
      dataCell(fmtL(data.cultureLitres), 1, { alignment: 'right' }),
    ],
    [
      { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtPct(100, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtL(data.totalLitres), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
    ],
  ];

  const cultureData = (data as unknown as Record<string, unknown>).cultureData as Array<Record<string, unknown>> | undefined;

  // ─── Build content ────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [

    ...sectionHeading('Declarant Information'),
    {
      table: {
        widths: [120, '*'],
        body: [
          kvRow('Name', params.declarantName, 0),
          kvRow('Title', params.declarantTitle, 1),
          kvRow('Date', today, 2),
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    },

    ...sectionHeading('Lot Identification'),
    {
      table: {
        widths: [120, '*'],
        body: [
          kvRow('Lot Number', data.lotNumber, 0),
          kvRow('Lot Name', data.lotName, 1),
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    },

    ...sectionHeading('Vessel Information'),
    {
      table: {
        widths: [120, '*'],
        body: [
          kvRow('Declared Volume', fmtL(data.totalLitres), 0),
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    },

    ...sectionHeading('Processing Location'),
    {
      table: {
        widths: [120, '*'],
        body: [kvRow('Winery', 'AVL Wines', 0)],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    },

    ...sectionHeading('Compliance Statements'),
    {
      ol: [
        { text: 'The above product has been processed in accordance with Wine Production Standard 4.5.1 of the Food Standards Code.', fontSize: 9, color: COLORS.dark, margin: [0, 0, 0, 4] },
        { text: 'This declaration confirms compliance with the Label Integrity Program under the Wine Australia Act 2013 and Wine Australia Regulations 2018.', fontSize: 9, color: COLORS.dark },
      ],
      margin: [0, 0, 0, 8],
    },

    ...sectionHeading('Goods Description'),
    { text: params.goodsDescription, fontSize: 9, color: COLORS.dark, margin: [0, 0, 0, 12] },

    ...sectionHeading('Composition Summary'),
    {
      table: { headerRows: 1, widths: ['*', 80, 100], body: [tableHeader('Component', '% Contribution', 'Litres'), ...compRows] },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    },

  ];

  // Varietal + Vintage side-by-side
  content.push({
    stack: [
      ...sectionHeading('Varietal & Vintage Breakdown'),
      buildVarietalVintageColumns(data.varietals, data.vintages, data.varietalMap, data.totalLitres, decimals),
    ],
    unbreakable: true,
  });

  // ── Appellation (grouped together to avoid page breaks within) ──────────

  if (data.appellations.length > 0 && (params.showAppellation || params.showDetailedAppellation)) {
    const appStack: Content[] = [];
    if (params.showAppellation) {
      appStack.push(...sectionHeading('Highest Appellation'));
      appStack.push(buildAppellationSummary(data.appellations, data.appellationMap, decimals));
    }
    if (params.showDetailedAppellation) {
      appStack.push(...sectionHeading('Detailed Appellation Hierarchy'));
      appStack.push(buildDetailedAppellationTable(data.appellations, data.appellationMap, data.totalLitres, false, decimals));
    }
    content.push({ stack: appStack, unbreakable: true });
  }

  // ── Culture & Sweetener ──────────────────────────────────────────────────

  if (params.showCulture && cultureData && cultureData.length > 0) {
    content.push(...sectionHeading('Culture & Sweetener'));
    const cRows = cultureData.map((r, i) => [
      dataCell(String(r.type ?? '—'), i),
      dataCell(String(r.appellation ?? '—'), i),
      dataCell(r.percentage != null ? fmtPct(Number(r.percentage), decimals) : '—', i, { alignment: 'right' }),
      dataCell(fmtL(r.litres != null ? Number(r.litres) : undefined), i, { alignment: 'right' }),
    ]);
    content.push({
      table: { headerRows: 1, widths: ['*', '*', 60, 80], body: [tableHeader('Type', 'Appellation', '%', 'Litres'), ...cRows] },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    });
  }

  // ── Lab Analyses ─────────────────────────────────────────────────────────

  if (params.showAnalysis) {
    content.push(...sectionHeading('Laboratory Analysis'));
    content.push(buildAnalysesTable(data.analyses));
  }

  // ── SWA Certification ────────────────────────────────────────────────────

  if (params.showSwa) {
    content.push(...sectionHeading('SWA Certification'));
    if (data.swaPercent != null) {
      content.push({
        columns: [
          { text: 'SWA Certified:', bold: true, fontSize: 9, width: 'auto' },
          { text: data.swaPercent > 0 ? 'Yes' : 'No', fontSize: 9, color: data.swaPercent > 0 ? COLORS.green : COLORS.red, bold: true, width: 'auto', margin: [6, 0, 20, 0] },
          { text: `${fmtPct(data.swaPercent, decimals)} sourced from SWA-certified vineyards`, fontSize: 9, color: COLORS.medium },
        ],
        margin: [0, 2, 0, 4],
      });
    } else {
      content.push({ text: 'SWA certification data not available for this lot.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 4] });
    }
    content.push(buildVeganStatus(data.isVegan));
  }

  // ── Allergens & Additives ────────────────────────────────────────────────

  if (params.showAllergens) {
    content.push(...sectionHeading('Allergens & Additives'));
    content.push(buildAdditivesTable(data.additives, data.additiveProducts, data.dryGoodIndicators));
  }

  // ── Signature Block ──────────────────────────────────────────────────────

  content.push({ text: '', pageBreak: 'before' });
  content.push(...sectionHeading('Signature'));
  content.push({
    stack: [
      { text: '\n\n\n________________________    Date: ___________', fontSize: 11 },
      { text: params.declarantName, fontSize: 9, bold: true, margin: [0, 4, 0, 0] },
      { text: params.declarantTitle, fontSize: 9, color: COLORS.medium },
      { text: 'AVL Wines', fontSize: 9, color: COLORS.medium },
    ],
    margin: [0, 20, 0, 0],
  });

  // ─── Document definition ─────────────────────────────────────────────────

  await pdfMake.createPdf({
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 50],
    header: pageHeader('AVL Wines', 'LIP Declaration Report', generated, data.lotNumber),
    footer: pageFooter('CONFIDENTIAL — AVL Wines LIP Declaration'),
    content,
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORS.dark, lineHeight: 1.2 },
  }).download(`LIP_Declaration_${data.lotNumber}.pdf`);
}

// ─── SWA helper (used by ReportButtons to compute from block components) ─────

export function computeSwaPercent(
  blockComponents: Array<{ block?: { id?: string }; percentage?: number }>,
  blockTagsMap: Record<string, string[]>,
): number {
  let swa = 0;
  blockComponents.forEach((bc) => {
    const tags = blockTagsMap[bc.block?.id ?? ''] ?? [];
    const pct = bc.percentage ?? 0;
    const pctNorm = pct > 1 ? pct : pct * 100;
    if (tags.some((t) => t.toLowerCase() === 'swa')) swa += pctNorm;
  });
  return swa;
}

// Compatibility: keep the old argument shape callable so existing callers
// get a clear error rather than a silent no-op.
export function _legacyGenerateDeclarationReport(_token: string, _lotId: string): Promise<void> {
  return Promise.reject(new Error('Use generateDeclarationReport(data) instead.'));
}

// Vegan detection from block tags / additive indicators
export function detectVegan(
  additives: Array<{ indicatorIds?: string[]; [k: string]: unknown }>,
  dryGoodIndicators: Record<string, string>,
): boolean | null {
  const allIndicatorNames: string[] = [];
  for (const a of additives) {
    if (Array.isArray(a.indicatorIds)) {
      a.indicatorIds.forEach((id) => {
        const name = dryGoodIndicators[String(id)];
        if (name) allIndicatorNames.push(name.toLowerCase());
      });
    }
    const embedded = (a as Record<string, unknown>).indicators;
    if (Array.isArray(embedded)) {
      embedded.forEach((ind: unknown) => {
        if (ind && typeof ind === 'object') {
          const i = ind as Record<string, unknown>;
          const name = String(i.name ?? i.abbreviation ?? '').toLowerCase();
          if (name) allIndicatorNames.push(name);
        }
      });
    }
  }
  if (!allIndicatorNames.length) return null;
  // Vegan = no allergen indicators that aren't 'vegan'/'organic'
  const hasNonVeganAllergen = allIndicatorNames.some(
    (n) => !['vegan', 'organic'].includes(n),
  );
  return !hasNonVeganAllergen;
}

// Extract makeup percentages from componentsSummary
export function extractMakeUp(summary: Record<string, unknown>): {
  juiceWinePercent?: number;
  juiceWineLitres?: number;
  culturePercent?: number;
  cultureLitres?: number;
} {
  const makeup = summary.makeup as Record<string, unknown> | undefined;
  if (!makeup) return {};
  const jwPct = (makeup.juiceWinePercent ?? makeup.juiceWine ?? makeup.juice_wine_percent) as number | undefined;
  const csPct = (makeup.cultureSweetenerPercent ?? makeup.cultureSweetener ?? makeup.culture_sweetener_percent) as number | undefined;
  return {
    juiceWinePercent: jwPct,
    culturePercent: csPct,
  };
}
