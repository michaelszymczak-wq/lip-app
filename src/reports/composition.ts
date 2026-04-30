import { getPdfMake } from './pdfSetup';
import type { CompositionReportData } from './types';
import {
  nowStr, toPct, fmtPct, fmtL, fmtVintage,
  sectionHeading, tableHeader, dataCell, warningBox, COLORS,
  pageHeader, pageFooter,
  buildLotSummaryTable, buildMakeUpTable,
  buildAnalysesTable, buildAdditivesTable, buildVeganStatus,
  buildAppellationSummary, buildDetailedAppellationTable,
  toLitres,
  type Content,
} from './pdfHelpers';

export type { CompositionReportData };

export async function generateCompositionReport(data: CompositionReportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const decimals = data.compositionDecimals ?? 4;
  const generated = nowStr();
  const cultureData = (data as unknown as Record<string, unknown>).cultureData as Array<Record<string, unknown>> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [

    // ── Section 1: Lot Summary ─────────────────────────────────────────────

    ...sectionHeading('1 — Lot Summary'),
    ...buildLotSummaryTable(data.lotNumber, data.lotName, data.vesselName, data.totalLitres, data.vesselCapacity),

    // ── Section 2: Lot Make Up ────────────────────────────────────────────

    ...sectionHeading('2 — Lot Make Up'),
    buildMakeUpTable(data.juiceWinePercent, data.juiceWineLitres, data.culturePercent, data.cultureLitres, data.totalLitres, decimals),

    // ── Section 3: Varietal Breakdown (grouped with vintage sub-rows) ─────

    ...sectionHeading('3 — Varietal Breakdown'),
  ];

  // Build varietal → vintage grouped table
  if (data.varietals.length === 0) {
    content.push({ text: 'No varietal data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] });
  } else {
    const totalPct = data.varietals.reduce((s, v) => s + toPct(v), 0);
    const totalL = data.varietals.reduce((s, v) => s + (toLitres(v, data.totalLitres) ?? 0), 0);

    // Flat rows with varietal label rows + any vintage sub-rows indented
    // (The API provides varietals and vintages as separate flat arrays;
    //  we show varietals then vintages grouped beneath each varietal where possible)
    const threshold = Math.pow(10, -decimals);
    const bigVarietals = data.varietals.filter((v) => toPct(v) >= threshold);
    const smallVarietals = data.varietals.filter((v) => toPct(v) < threshold);
    const bigVintages = data.vintages.filter((vt) => toPct(vt) >= threshold);
    const smallVintages = data.vintages.filter((vt) => toPct(vt) < threshold);
    const tableBody: ReturnType<typeof tableHeader>[] = [tableHeader('Component', '% of Lot', 'Litres')];

    bigVarietals.forEach((v, vi) => {
      const id = String(v.varietalId ?? v.id ?? '');
      const name = data.varietalMap[id] ?? v.name ?? (id || 'Unknown');
      const pct = toPct(v);
      const litres = toLitres(v, data.totalLitres);
      const fillColor = vi % 2 === 0 ? null : '#f8fafc';
      tableBody.push([
        { text: name, bold: true, fontSize: 9, color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
        { text: fmtPct(pct, decimals), bold: true, fontSize: 9, alignment: 'right', color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
        { text: fmtL(litres), bold: true, fontSize: 9, alignment: 'right', color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
      ]);
      bigVintages.forEach((vt, vti) => {
        const vtPct = toPct(vt);
        const vtLitres = toLitres(vt, data.totalLitres);
        const vtFill = (vi * bigVintages.length + vti) % 2 === 0 ? '#f0f9ff' : '#e0f2fe';
        void vtFill;
        tableBody.push([
          { text: `    └ ${fmtVintage(vt.vintage ?? vt.year)}`, fontSize: 8, color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtPct(vtPct, decimals), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtL(vtLitres), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
        ]);
      });
      if (smallVintages.length > 0) {
        const otherVtPct = smallVintages.reduce((s, vt) => s + toPct(vt), 0);
        const otherVtL = smallVintages.reduce((s, vt) => s + (toLitres(vt, data.totalLitres) ?? 0), 0);
        tableBody.push([
          { text: '    └ Other', fontSize: 8, color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtPct(otherVtPct, decimals), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtL(otherVtL > 0 ? otherVtL : undefined), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
        ]);
      }
    });
    if (smallVarietals.length > 0) {
      const otherVPct = smallVarietals.reduce((s, v) => s + toPct(v), 0);
      const otherVL = smallVarietals.reduce((s, v) => s + (toLitres(v, data.totalLitres) ?? 0), 0);
      const vi = bigVarietals.length;
      const fillColor = vi % 2 === 0 ? null : '#f8fafc';
      tableBody.push([
        { text: 'Other', bold: true, fontSize: 9, color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
        { text: fmtPct(otherVPct, decimals), bold: true, fontSize: 9, alignment: 'right', color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
        { text: fmtL(otherVL > 0 ? otherVL : undefined), bold: true, fontSize: 9, alignment: 'right', color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
      ]);
    }

    tableBody.push([
      { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtPct(totalPct, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtL(totalL), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
    ]);

    content.push({
      table: { headerRows: 1, widths: ['*', 70, 90], body: tableBody },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    });
  }

  // ── Sections 4+5: Appellation (grouped to avoid mid-section page breaks) ──

  {
    const appStack: Content[] = [
      ...sectionHeading('4 — Highest Appellation'),
      data.appellations.length > 0
        ? buildAppellationSummary(data.appellations, data.appellationMap, decimals)
        : { text: 'No appellation data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] },
      ...sectionHeading('5 — Detailed Appellation Hierarchy'),
      data.appellations.length > 0
        ? buildDetailedAppellationTable(data.appellations, data.appellationMap, data.totalLitres, false, decimals)
        : { text: 'No appellation data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] },
    ];
    if (data.appellations.length > 0) {
      const allPct = data.appellations.reduce((s, a) => s + toPct(a), 0);
      if (Math.abs(allPct - 100) > 0.1) {
        appStack.push(warningBox(`⚠ Appellation percentages total ${fmtPct(allPct, decimals)} — expected ${fmtPct(100, decimals)}. Verify composition data.`, 'amber'));
      }
    }
    content.push({ stack: appStack, unbreakable: true });
  }

  // ── Section 6: Culture & Sweetener ───────────────────────────────────────

  if (cultureData && cultureData.length > 0) {
    content.push(...sectionHeading('6 — Culture & Sweetener'));
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

  // ── Section 7: Laboratory Analysis ──────────────────────────────────────

  content.push(...sectionHeading('7 — Laboratory Analysis'));
  content.push(buildAnalysesTable(data.analyses));

  // ── Section 8: Additives & Allergens ─────────────────────────────────────

  content.push(...sectionHeading('8 — Additives & Allergens'));
  content.push(buildAdditivesTable(data.additives, data.additiveProducts, data.dryGoodIndicators));

  // ── Section 9: Vegan Status ──────────────────────────────────────────────

  content.push(...sectionHeading('9 — Vegan Status'));
  content.push(buildVeganStatus(data.isVegan));

  // ─── Document definition ─────────────────────────────────────────────────

  await pdfMake.createPdf({
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 50],
    header: pageHeader('AVL Wines', 'LIP Composition Details Report', generated, data.lotNumber),
    footer: pageFooter('CONFIDENTIAL — AVL Wines | Composition Details'),
    content,
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORS.dark, lineHeight: 1.2 },
  }).download(`LIP_Composition_${data.lotNumber}.pdf`);
}
