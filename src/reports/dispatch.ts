import { getPdfMake } from './pdfSetup';
import type { DispatchReportData, LabelComplianceRow } from './types';
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

export type { DispatchReportData };

export async function generateDispatchReport(data: DispatchReportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const decimals = data.compositionDecimals ?? 4;
  const generated = nowStr();
  const cultureData = (data as unknown as Record<string, unknown>).cultureData as Array<Record<string, unknown>> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [

    // ── Section 1: Lot Summary ────────────────────────────────────────────

    ...sectionHeading('1 — Lot Summary'),
    ...buildLotSummaryTable(data.lotNumber, data.lotName, data.vesselName, data.totalLitres, data.vesselCapacity),

    // ── Section 2: Lot Make Up (with recalculated % discrepancy check) ────

    ...sectionHeading('2 — Lot Make Up'),
  ];

  // Make-up with stored vs recalculated %
  if (data.totalLitres && data.totalLitres > 0) {
    const jwCalc = data.juiceWineLitres != null ? (data.juiceWineLitres / data.totalLitres) * 100 : undefined;
    const csCalc = data.cultureLitres != null ? (data.cultureLitres / data.totalLitres) * 100 : undefined;
    const jwDiff = jwCalc != null && data.juiceWinePercent != null ? Math.abs(jwCalc - data.juiceWinePercent) : 0;
    const csDiff = csCalc != null && data.culturePercent != null ? Math.abs(csCalc - data.culturePercent) : 0;

    const makeupRows = [
      [
        dataCell('Juice / Wine', 0),
        dataCell(data.juiceWinePercent != null ? fmtPct(data.juiceWinePercent, decimals) : '—', 0, { alignment: 'right' }),
        dataCell(fmtL(data.juiceWineLitres), 0, { alignment: 'right' }),
        {
          text: jwCalc != null ? fmtPct(jwCalc, decimals) : '—',
          fontSize: 9, alignment: 'right',
          color: jwDiff > 0.05 ? COLORS.red : COLORS.dark,
          fillColor: jwDiff > 0.05 ? '#fffbeb' : null,
          margin: [3, 3, 3, 3],
        },
      ],
      [
        dataCell('Culture / Sweetener', 1),
        dataCell(data.culturePercent != null ? fmtPct(data.culturePercent, decimals) : '—', 1, { alignment: 'right' }),
        dataCell(fmtL(data.cultureLitres), 1, { alignment: 'right' }),
        {
          text: csCalc != null ? fmtPct(csCalc, decimals) : '—',
          fontSize: 9, alignment: 'right',
          color: csDiff > 0.05 ? COLORS.red : COLORS.dark,
          fillColor: csDiff > 0.05 ? '#fffbeb' : (1 % 2 === 0 ? null : '#f8fafc'),
          margin: [3, 3, 3, 3],
        },
      ],
      [
        { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
        { text: fmtPct(100, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
        { text: fmtL(data.totalLitres), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
        { text: fmtPct(100, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      ],
    ];
    content.push({
      table: { headerRows: 1, widths: ['*', 70, 90, 80], body: [tableHeader('Component', '%', 'Litres', 'Calculated %'), ...makeupRows] },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    });
    if (jwDiff > 0.05 || csDiff > 0.05) {
      content.push(warningBox('⚠ Data discrepancy: stored percentage and recalculated percentage differ by more than 0.05%. Verify source data.', 'amber'));
    }
  } else {
    content.push(buildMakeUpTable(data.juiceWinePercent, data.juiceWineLitres, data.culturePercent, data.cultureLitres, data.totalLitres, decimals));
  }

  // ── Section 3: Intended Use ─────────────────────────────────────────────

  content.push(...sectionHeading('3 — Intended Use'));
  const intendedUse = (data as unknown as Record<string, unknown>).intendedUse as Array<Record<string, unknown>> | undefined;
  if (intendedUse && intendedUse.length > 0) {
    const iuRows = intendedUse.map((r, i) => [
      dataCell(String(r.code ?? '—'), i),
      dataCell(String(r.name ?? '—'), i),
      dataCell(fmtL(r.litres != null ? Number(r.litres) : undefined), i, { alignment: 'right' }),
    ]);
    content.push({
      table: { headerRows: 1, widths: [80, '*', 90], body: [tableHeader('Intended Use Code', 'Intended Use Name', 'Associated Litres'), ...iuRows] },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    });
  } else {
    content.push(warningBox('Intended Use: Not recorded — confirm with winemaker before dispatch.', 'amber'));
  }

  // ── Section 4: Laboratory Analysis ──────────────────────────────────────

  content.push(...sectionHeading('4 — Laboratory Analysis'));
  content.push(buildAnalysesTable(data.analyses));

  // ── Section 5: Varietal Breakdown ────────────────────────────────────────

  content.push(...sectionHeading('5 — Varietal Breakdown'));
  if (data.varietals.length === 0) {
    content.push({ text: 'No varietal data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] });
  } else {
    const totalPct = data.varietals.reduce((s, v) => s + toPct(v), 0);
    const totalL = data.varietals.reduce((s, v) => s + (toLitres(v, data.totalLitres) ?? 0), 0);
    const threshold = Math.pow(10, -decimals);
    const bigVarietals = data.varietals.filter((v) => toPct(v) >= threshold);
    const smallVarietals = data.varietals.filter((v) => toPct(v) < threshold);
    const bigVintages = data.vintages.filter((vt) => toPct(vt) >= threshold);
    const smallVintages = data.vintages.filter((vt) => toPct(vt) < threshold);
    const tableBody = [tableHeader('Component', '% of Lot', 'Litres')];
    bigVarietals.forEach((v, vi) => {
      const id = String(v.varietalId ?? v.id ?? '');
      const name = data.varietalMap[id] ?? v.name ?? (id || 'Unknown');
      const fillColor = vi % 2 === 0 ? null : '#f8fafc';
      tableBody.push([
        { text: name, bold: true, fontSize: 9, color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
        { text: fmtPct(toPct(v), decimals), bold: true, fontSize: 9, alignment: 'right', fillColor, margin: [3, 3, 3, 3] },
        { text: fmtL(toLitres(v, data.totalLitres)), bold: true, fontSize: 9, alignment: 'right', fillColor, margin: [3, 3, 3, 3] },
      ] as ReturnType<typeof tableHeader>);
      bigVintages.forEach((vt, vti) => {
        const vtFill = (vi + vti) % 2 === 0 ? '#f0f9ff' : '#e0f2fe';
        void vtFill;
        tableBody.push([
          { text: `    └ ${fmtVintage(vt.vintage ?? vt.year)}`, fontSize: 8, color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtPct(toPct(vt), decimals), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtL(toLitres(vt, data.totalLitres)), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
        ] as ReturnType<typeof tableHeader>);
      });
      if (smallVintages.length > 0) {
        const otherVtPct = smallVintages.reduce((s, vt) => s + toPct(vt), 0);
        const otherVtL = smallVintages.reduce((s, vt) => s + (toLitres(vt, data.totalLitres) ?? 0), 0);
        tableBody.push([
          { text: '    └ Other', fontSize: 8, color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtPct(otherVtPct, decimals), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
          { text: fmtL(otherVtL > 0 ? otherVtL : undefined), fontSize: 8, alignment: 'right', color: COLORS.medium, fillColor: '#f0f9ff', margin: [3, 2, 3, 2] },
        ] as ReturnType<typeof tableHeader>);
      }
    });
    if (smallVarietals.length > 0) {
      const otherVPct = smallVarietals.reduce((s, v) => s + toPct(v), 0);
      const otherVL = smallVarietals.reduce((s, v) => s + (toLitres(v, data.totalLitres) ?? 0), 0);
      const vi = bigVarietals.length;
      const fillColor = vi % 2 === 0 ? null : '#f8fafc';
      tableBody.push([
        { text: 'Other', bold: true, fontSize: 9, color: COLORS.dark, fillColor, margin: [3, 3, 3, 3] },
        { text: fmtPct(otherVPct, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor, margin: [3, 3, 3, 3] },
        { text: fmtL(otherVL > 0 ? otherVL : undefined), bold: true, fontSize: 9, alignment: 'right', fillColor, margin: [3, 3, 3, 3] },
      ] as ReturnType<typeof tableHeader>);
    }
    tableBody.push([
      { text: 'Total', bold: true, fontSize: 9, fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtPct(totalPct, decimals), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      { text: fmtL(totalL), bold: true, fontSize: 9, alignment: 'right', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
    ] as ReturnType<typeof tableHeader>);
    content.push({ table: { headerRows: 1, widths: ['*', 70, 90], body: tableBody }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 8] });
  }

  // ── Sections 6+7: Appellation (grouped to avoid mid-section page breaks) ──

  {
    const appStack: Content[] = [
      ...sectionHeading('6 — Highest Appellation'),
      data.appellations.length > 0
        ? buildAppellationSummary(data.appellations, data.appellationMap, decimals)
        : { text: 'No appellation data.', fontSize: 9, color: COLORS.light, italics: true, margin: [0, 2, 0, 8] },
      ...sectionHeading('7 — Detailed Appellation Hierarchy'),
      buildDetailedAppellationTable(data.appellations, data.appellationMap, data.totalLitres, true, decimals),
    ];
    content.push({ stack: appStack, unbreakable: true });
  }

  // ── Section 8: Culture & Sweetener ───────────────────────────────────────

  if (cultureData && cultureData.length > 0) {
    content.push(...sectionHeading('8 — Culture & Sweetener'));
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

  // ── Section 9: Additives & Allergens ─────────────────────────────────────

  content.push(...sectionHeading('9 — Additives & Allergens'));
  content.push(buildAdditivesTable(data.additives, data.additiveProducts, data.dryGoodIndicators));

  // ── Section 10: Label Compliance ⚠ CRITICAL ──────────────────────────────

  content.push(...sectionHeading('10 — Label Compliance'));
  if (data.labelCompliance && data.labelCompliance.length > 0) {
    const hasFailure = data.labelCompliance.some((r) => r.status === 'NON-COMPLIANT');
    if (hasFailure) {
      content.push(warningBox('⚠ WARNING: One or more label compliance checks have FAILED. This lot must NOT be dispatched until compliance is confirmed.', 'red'));
    }

    const lcRows = data.labelCompliance.map((r: LabelComplianceRow, i) => {
      const isNonCompliant = r.status === 'NON-COMPLIANT';
      const rowFill = isNonCompliant ? '#F8D7DA' : (i % 2 === 0 ? null : '#f8fafc');
      const statusColor = r.status === 'COMPLIANT' ? COLORS.green : r.status === 'NON-COMPLIANT' ? COLORS.red : COLORS.amber;
      const cell = (t: string, opts = {}): unknown => ({ text: t, fontSize: 9, color: COLORS.dark, fillColor: rowFill, margin: [3, 3, 3, 3], ...opts });
      return [
        cell(r.market),
        cell(fmtPct(r.tolerance), { alignment: 'right' }),
        cell(String(r.latestResult), { alignment: 'right' }),
        cell(String(r.labelValue), { alignment: 'right' }),
        cell(String(r.minLabel), { alignment: 'right' }),
        cell(String(r.maxLabel), { alignment: 'right' }),
        { text: r.status, fontSize: 9, bold: isNonCompliant, color: statusColor, fillColor: rowFill, margin: [3, 3, 3, 3] },
      ];
    });

    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 50, 60, 60, 50, 50, 70],
        body: [tableHeader('Market', 'Tol %', 'Latest', 'Label', 'Min', 'Max', 'Status'), ...lcRows],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    });
  } else {
    content.push(warningBox('Label Compliance data not available from the API for this lot. Manual compliance verification is required before dispatch.', 'amber'));
  }

  // ── Section 11: Vegan Status ──────────────────────────────────────────────

  content.push(...sectionHeading('11 — Vegan Status'));
  content.push(buildVeganStatus(data.isVegan));

  // ── Approval Block (own page) ─────────────────────────────────────────────

  content.push({ text: '', pageBreak: 'before' });
  content.push(...sectionHeading('Dispatch Approval'));
  content.push({
    stack: [
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLORS.border }] },
      { text: `\nLot ${data.lotNumber} has been reviewed and is approved / not approved for dispatch.\n`, fontSize: 9, color: COLORS.dark, margin: [0, 8, 0, 8] },
      { text: 'Approved by: _____________________\n', fontSize: 9 },
      { text: 'Name: ___________________________\n', fontSize: 9, margin: [0, 8, 0, 0] },
      { text: 'Title: ___________________________\n', fontSize: 9, margin: [0, 8, 0, 0] },
      { text: 'Date:  ___________________________\n', fontSize: 9, margin: [0, 8, 0, 0] },
      { text: 'Signature: _______________________\n', fontSize: 9, margin: [0, 8, 0, 0] },
      { text: 'Notes: __________________________________________________', fontSize: 9, margin: [0, 8, 0, 0] },
    ],
    margin: [0, 12, 0, 0],
  });

  // ─── Document definition ─────────────────────────────────────────────────

  await pdfMake.createPdf({
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 50],
    header: pageHeader('AVL Wines', 'Dispatch Approval Report', generated, data.lotNumber),
    footer: pageFooter('AVL Wines — Dispatch Approval | CONFIDENTIAL'),
    content,
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORS.dark, lineHeight: 1.2 },
  }).download(`LIP_Dispatch_${data.lotNumber}.pdf`);
}
