import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type {
  Lot,
  ComponentsSummary,
  VintageRow,
  VarietalRow,
  AppellationRow,
  BlockComponent,
  Additive,
  AdditiveProduct,
  Analysis,
  AnalysisType,
} from '../fetch';

// ─── Colors & styles ──────────────────────────────────────────────────────────

export const colors = {
  dark: '#1e293b',
  medium: '#475569',
  light: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
  accent: '#1e3a8a',
  allergen: '#dc2626',
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 30,
    color: '#1e293b',
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  headerMeta: {
    fontSize: 8,
    color: '#475569',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginTop: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 2,
  },
  // Info rows (label / value)
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  infoLabel: {
    color: '#475569',
    width: '40%',
  },
  infoValue: {
    fontFamily: 'Helvetica-Bold',
    width: '60%',
    textAlign: 'right',
  },
  infoValueEmpty: {
    fontFamily: 'Helvetica-Oblique',
    color: '#94a3b8',
    width: '60%',
    textAlign: 'right',
  },
  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableCell: {
    color: '#1e293b',
    fontSize: 9,
  },
  tableCellMuted: {
    color: '#475569',
    fontSize: 9,
  },
  tableCellEmpty: {
    fontFamily: 'Helvetica-Oblique',
    color: '#94a3b8',
    fontSize: 9,
  },
  emptyNote: {
    fontFamily: 'Helvetica-Oblique',
    color: '#94a3b8',
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  // Composition sub-card
  compCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  compCardTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#475569',
    backgroundColor: '#f8fafc',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    textTransform: 'uppercase',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
    fontSize: 8,
    color: '#94a3b8',
  },
});

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmtPct(n: number): string {
  return n.toFixed(2);
}

export function fmtLitres(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(raw: string | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function toPct(row: { percentage?: number; percent?: number }): number {
  const raw = row.percentage ?? row.percent ?? 0;
  return raw > 1 ? raw : raw * 100;
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  lotCode?: string;
  generated: string;
}

export function PageHeader({ title, lotCode, generated }: PageHeaderProps) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerTitle}>{title}</Text>
      {lotCode ? (
        <Text style={styles.headerMeta}>Lot: {lotCode}</Text>
      ) : null}
      <Text style={styles.headerMeta}>Generated: {generated}</Text>
    </View>
  );
}

// ─── PageFooter ───────────────────────────────────────────────────────────────

interface PageFooterProps {
  reportType: string;
}

export function PageFooter({ reportType }: PageFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text>{reportType} — Confidential</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

// ─── Section 1: Lot Information ───────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {value ? (
        <Text style={styles.infoValue}>{value}</Text>
      ) : (
        <Text style={styles.infoValueEmpty}>—</Text>
      )}
    </View>
  );
}

interface LotInfoSectionProps {
  lot: Lot;
}

export function LotInfoSection({ lot }: LotInfoSectionProps) {
  return (
    <View>
      <InfoRow label="Lot Code" value={lot.code} />
      <InfoRow label="Lot Name" value={lot.name} />
    </View>
  );
}

// ─── Section 2: Juice/Wine Composition ───────────────────────────────────────

type LookupMap = Record<string, string>;

function calcLitres(
  row: VintageRow | VarietalRow | AppellationRow,
): number | undefined {
  const v = (row as VintageRow).liters ?? (row as VintageRow).litres;
  return v != null ? Number(v) : undefined;
}

interface CompTableProps {
  title: string;
  rows: { label: string; pct: number; litres?: number }[];
}

function CompTable({ title, rows }: CompTableProps) {
  const showLitres = rows.some((r) => r.litres != null);
  const total = rows.reduce((s, r) => s + r.pct, 0);
  const totalL = showLitres
    ? rows.reduce((s, r) => s + (r.litres ?? 0), 0)
    : undefined;

  return (
    <View style={styles.compCard}>
      <Text style={styles.compCardTitle}>{title}</Text>
      {/* header */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>%</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1, paddingLeft: 6 }]}>Name</Text>
        {showLitres ? (
          <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>
            Litres
          </Text>
        ) : null}
      </View>
      {/* rows */}
      {rows.map((r, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '12%', textAlign: 'right' }]}>
            {fmtPct(r.pct)}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, paddingLeft: 6 }]}>{r.label}</Text>
          {showLitres ? (
            <Text style={[styles.tableCellMuted, { width: '20%', textAlign: 'right' }]}>
              {r.litres != null ? fmtLitres(r.litres) : '—'}
            </Text>
          ) : null}
        </View>
      ))}
      {/* total */}
      <View
        style={[
          styles.tableRow,
          { borderTopWidth: 1, borderTopColor: '#e2e8f0' },
        ]}
      >
        <Text
          style={[
            styles.tableCell,
            { width: '12%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
          ]}
        >
          {fmtPct(total)}
        </Text>
        <Text style={[styles.tableCell, { flex: 1, paddingLeft: 6 }]} />
        {showLitres ? (
          <Text
            style={[
              styles.tableCellMuted,
              { width: '20%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
            ]}
          >
            {totalL != null ? fmtLitres(totalL) : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface CompositionSectionProps {
  data: ComponentsSummary;
  varietalMap: LookupMap;
  appellationMap: LookupMap;
}

export function CompositionSection({
  data,
  varietalMap,
  appellationMap,
}: CompositionSectionProps) {
  const vintages = data.vintages ?? [];
  const varietalList = data.varietals ?? [];
  const appellationList = data.appellations ?? [];

  if (!vintages.length && !varietalList.length && !appellationList.length) {
    return <Text style={styles.emptyNote}>No composition data available.</Text>;
  }

  const vintageRows = vintages.map((v) => ({
    label: String(v.vintage ?? v.year ?? '—'),
    pct: toPct(v),
    litres: calcLitres(v),
  }));

  const varietalRows = varietalList.map((v) => {
    const id = String(v.varietalId ?? v.id ?? '');
    const name = (varietalMap[id] ?? v.name ?? id) || 'Unknown';
    return { label: name, pct: toPct(v), litres: calcLitres(v) };
  });

  const appellationRows = appellationList.map((app, i) => {
    const id = String(app.appellationId ?? app.id ?? '');
    const name = (appellationMap[id] ?? app.name ?? id) || `Appellation ${i + 1}`;
    return { label: name, pct: toPct(app), litres: calcLitres(app) };
  });

  // Sub-appellations (flattened)
  const subAppRows: { label: string; pct: number; litres?: number }[] = [];
  appellationList.forEach((app) => {
    ((app.subAppellations ?? []) as AppellationRow[]).forEach((sub) => {
      const sid = String(sub.appellationId ?? sub.id ?? '');
      const sname = (appellationMap[sid] ?? sub.name ?? sid) || '—';
      subAppRows.push({ label: `  ${sname}`, pct: toPct(sub), litres: calcLitres(sub) });
    });
  });

  return (
    <View>
      {vintageRows.length > 0 ? (
        <CompTable title="Vintage" rows={vintageRows} />
      ) : null}
      {varietalRows.length > 0 ? (
        <CompTable title="Varietal" rows={varietalRows} />
      ) : null}
      {appellationRows.length > 0 ? (
        <CompTable title="Appellation (GI)" rows={appellationRows} />
      ) : null}
      {subAppRows.length > 0 ? (
        <CompTable title="Sub-Appellation" rows={subAppRows} />
      ) : null}
    </View>
  );
}

// ─── Section 3: Block Components ─────────────────────────────────────────────

interface BlockComponentsSectionProps {
  data: BlockComponent[];
}

export function BlockComponentsSection({ data }: BlockComponentsSectionProps) {
  if (data.length === 0) {
    return <Text style={styles.emptyNote}>No block components recorded.</Text>;
  }

  function toPctNum(pct: number | undefined): number {
    if (pct == null) return 0;
    return pct > 1 ? pct : pct * 100;
  }

  // Roll up percentages by tag
  const tagTotals: Record<string, number> = {};
  data.forEach((row) => {
    const tags = (row.tags ?? []) as string[];
    const pct = toPctNum(row.percentage);
    tags.forEach((tag) => {
      tagTotals[tag] = (tagTotals[tag] ?? 0) + pct;
    });
  });
  const tagEntries = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);

  return (
    <View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { width: '18%' }]}>Vineyard</Text>
        <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Block</Text>
        <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Tags</Text>
        <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Varietal</Text>
        <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Appellation</Text>
        <Text style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}>
          Vintage
        </Text>
        <Text style={[styles.tableHeaderCell, { width: '6%', textAlign: 'right' }]}>%</Text>
      </View>
      {data.map((row, i) => {
        const tags = (row.tags ?? []) as string[];
        return (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '18%' }]}>
              {row.vineyard?.name ?? '—'}
            </Text>
            <Text style={[styles.tableCellMuted, { width: '14%' }]}>
              {row.block?.name ?? '—'}
            </Text>
            <Text style={[styles.tableCellMuted, { width: '22%' }]}>
              {tags.length > 0 ? tags.join(', ') : '—'}
            </Text>
            <Text style={[styles.tableCellMuted, { width: '16%' }]}>
              {row.varietal?.name ?? '—'}
            </Text>
            <Text style={[styles.tableCellMuted, { width: '16%' }]}>
              {row.appellation?.name ?? '—'}
            </Text>
            <Text
              style={[styles.tableCellMuted, { width: '8%', textAlign: 'center' }]}
            >
              {row.vintage != null ? String(row.vintage) : '—'}
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: '6%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
              ]}
            >
              {fmtPct(toPctNum(row.percentage))}
            </Text>
          </View>
        );
      })}

      {tagEntries.length > 0 ? (
        <View style={{ marginTop: 6 }}>
          <Text
            style={[
              styles.compCardTitle,
              { marginBottom: 4, backgroundColor: 'transparent', borderBottomWidth: 0 },
            ]}
          >
            SWA Status
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {tagEntries.map(([tag, pct], i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#bfdbfe',
                  borderRadius: 4,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  backgroundColor: '#eff6ff',
                }}
              >
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' }}>
                  {tag}
                </Text>
                <Text style={{ fontSize: 8, color: '#2563eb', marginLeft: 4 }}>
                  {fmtPct(pct)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ─── Section 4: Additives / Allergens ────────────────────────────────────────

function resolveAdditiveName(
  additive: Additive,
  productMap: Record<string, string>,
): string {
  const refId = String(additive.additiveId ?? additive.id ?? '');
  if (refId && productMap[refId]) return productMap[refId];
  return String((additive.name ?? additive.additiveName ?? refId) || '—');
}

function resolveAmount(additive: Additive): { value: string; unit: string } {
  const raw = additive.amount;
  if (raw == null) return { value: '—', unit: '—' };
  if (typeof raw === 'object') {
    return {
      value: raw.value != null ? String(raw.value) : '—',
      unit: raw.unit ?? '—',
    };
  }
  return {
    value: String(raw),
    unit: String(additive.unitOfMeasure ?? additive.uom ?? '—'),
  };
}

const NON_ALLERGEN_LABELS = new Set(['vegan', 'organic']);

function resolveAllergen(additive: Additive, indicatorNames: string[]): boolean {
  if (indicatorNames.length > 0) {
    return indicatorNames.some((n) => !NON_ALLERGEN_LABELS.has(n.toLowerCase()));
  }
  if (additive.isAllergen != null) return Boolean(additive.isAllergen);
  if (additive.allergen != null) return Boolean(additive.allergen);
  return false;
}

function resolveIndicators(
  additive: Additive,
  indicatorMap: Record<string, string>,
): string[] {
  const embedded = (additive as Record<string, unknown>).indicators;
  if (Array.isArray(embedded) && embedded.length > 0) {
    const names = embedded
      .map((ind: unknown) => {
        if (!ind || typeof ind !== 'object') return String(ind ?? '');
        const i = ind as Record<string, unknown>;
        const id = String(i.id ?? '');
        if (id && indicatorMap[id]) return indicatorMap[id];
        return String(i.name ?? i.abbreviation ?? id ?? '');
      })
      .filter(Boolean);
    if (names.length > 0) return names;
  }
  if (Array.isArray(additive.indicatorIds) && additive.indicatorIds.length > 0) {
    return additive.indicatorIds.map((id) => indicatorMap[String(id)] ?? String(id));
  }
  return [];
}

interface AdditivesSectionProps {
  data: Additive[];
  additiveProducts: AdditiveProduct[];
  indicatorMap: Record<string, string>;
}

export function AdditivesSection({ data, additiveProducts, indicatorMap }: AdditivesSectionProps) {
  if (data.length === 0) {
    return <Text style={styles.emptyNote}>No additives recorded.</Text>;
  }

  const productMap: Record<string, string> = {};
  additiveProducts.forEach((p) => {
    productMap[p.id] = p.productName ?? '';
  });

  return (
    <View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Additive</Text>
        <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>
          Amount
        </Text>
        <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Unit</Text>
        <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>
          Allergen
        </Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Allergen Type</Text>
      </View>
      {data.map((additive, i) => {
        const { value, unit } = resolveAmount(additive);
        const indicators = resolveIndicators(additive, indicatorMap);
        const isAllergen = resolveAllergen(additive, indicators);
        return (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '28%', fontFamily: 'Helvetica-Bold' }]}>
              {resolveAdditiveName(additive, productMap)}
            </Text>
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>
              {value}
            </Text>
            <Text style={[styles.tableCellMuted, { width: '10%' }]}>{unit}</Text>
            <Text
              style={[
                styles.tableCell,
                {
                  width: '10%',
                  textAlign: 'center',
                  color: isAllergen ? colors.allergen : colors.medium,
                  fontFamily: isAllergen ? 'Helvetica-Bold' : 'Helvetica',
                },
              ]}
            >
              {isAllergen ? 'Yes' : 'No'}
            </Text>
            <Text
              style={[
                styles.tableCell,
                {
                  flex: 1,
                  color: indicators.length > 0 ? colors.allergen : colors.light,
                },
              ]}
            >
              {indicators.length > 0 ? indicators.join(', ') : '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Section 5: Lab Analyses ──────────────────────────────────────────────────

function resolveAnalysisDate(a: Analysis): string | undefined {
  return a.recordedAt ?? a.date ?? a.analysisDate ?? a.createdAt;
}

function resolveAnalysisName(a: Analysis): string {
  const type = a.analysisType as AnalysisType | undefined;
  if (type) return String(type.name ?? type.abbreviation ?? '—');
  return String((a as Record<string, unknown>).analysisName ?? '—');
}

function resolveAnalysisValue(a: Analysis): string {
  const v = a.value ?? (a as Record<string, unknown>).result;
  return v != null ? String(v) : '—';
}

function resolveAnalysisUnit(a: Analysis): string {
  if (a.unit?.unit) return a.unit.unit;
  const type = a.analysisType as AnalysisType | undefined;
  if (type?.unit) return String(type.unit);
  return String(a.unitOfMeasure ?? a.uom ?? '—');
}

interface AnalysesSectionProps {
  data: Analysis[];
}

export function AnalysesSection({ data }: AnalysesSectionProps) {
  if (data.length === 0) {
    return <Text style={styles.emptyNote}>No lab analyses recorded.</Text>;
  }

  // Keep only the most recent entry per analysis type
  const latestByType = new Map<string, Analysis>();
  for (const a of data) {
    const key = resolveAnalysisName(a);
    const existing = latestByType.get(key);
    if (!existing) {
      latestByType.set(key, a);
    } else {
      const ta = new Date(resolveAnalysisDate(a) ?? '').getTime() || 0;
      const te = new Date(resolveAnalysisDate(existing) ?? '').getTime() || 0;
      if (ta > te) latestByType.set(key, a);
    }
  }

  const sorted = [...latestByType.values()].sort((a, b) => {
    const ta = new Date(resolveAnalysisDate(a) ?? '').getTime() || 0;
    const tb = new Date(resolveAnalysisDate(b) ?? '').getTime() || 0;
    return tb - ta;
  });

  return (
    <View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Analysis</Text>
        <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>
          Value
        </Text>
        <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Unit</Text>
        <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Date</Text>
      </View>
      {sorted.map((analysis, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 1 }]}>
            {resolveAnalysisName(analysis)}
          </Text>
          <Text
            style={[
              styles.tableCell,
              { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
            ]}
          >
            {resolveAnalysisValue(analysis)}
          </Text>
          <Text style={[styles.tableCellMuted, { width: '14%' }]}>
            {resolveAnalysisUnit(analysis)}
          </Text>
          <Text style={[styles.tableCellMuted, { width: '22%' }]}>
            {formatDate(resolveAnalysisDate(analysis))}
          </Text>
        </View>
      ))}
    </View>
  );
}
