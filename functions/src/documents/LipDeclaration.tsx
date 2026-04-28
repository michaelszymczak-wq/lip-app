import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { AllLotData, Lot } from '../fetch';
import {
  styles,
  colors,
  fmtLitres,
  PageFooter,
  LotInfoSection,
  CompositionSection,
  BlockComponentsSection,
  AdditivesSection,
  AnalysesSection,
} from './shared';

interface Props {
  data: AllLotData;
}

// ─── Volume helper ────────────────────────────────────────────────────────────

function lotVolumeStr(lot: Lot): string {
  const vol = lot.volume;
  if (!vol || vol.value == null) return '___________';
  const v = vol.value;
  let litres: number;
  switch ((vol.unit ?? '').toLowerCase()) {
    case 'gal': case 'gallon': case 'gallons': litres = v * 3.78541; break;
    case 'hl': case 'hectolitre': case 'hectoliter': litres = v * 100; break;
    case 'ml': litres = v * 0.001; break;
    default: litres = v;
  }
  return fmtLitres(litres);
}

// ─── Vessel code helper ───────────────────────────────────────────────────────

function vesselCode(lot: Lot, bond: { name?: string; code?: string }): string {
  return bond.name ?? bond.code ?? lot.bondId ?? '___________';
}

// ─── Declaration block (page 1 only) ─────────────────────────────────────────

function DeclarationBlock({ lot, bond, generated, signatoryName }: { lot: Lot; bond: { name?: string; code?: string }; generated: string; signatoryName: string }) {
  const clause: React.CSSProperties = {};
  void clause;

  const body = { fontSize: 9, color: colors.dark, lineHeight: 1.4 } as const;

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Document title */}
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'Helvetica-Bold',
          textAlign: 'center',
          color: colors.accent,
          marginBottom: 5,
          letterSpacing: 0.5,
        }}
      >
        LIP DECLARATION – WINE / JUICE
      </Text>

      {/* Metadata */}
      <Text style={{ fontSize: 8, color: colors.medium, textAlign: 'right', marginBottom: 6 }}>
        {`Lot: ${lot.code ?? '—'}   |   Generated: ${generated}`}
      </Text>

      {/* Signatory — single line */}
      <Text style={{ ...body, marginBottom: 4 }}>
        {`I, ${signatoryName}, being ccw of BURONGA HILL WINERY declare that`}
      </Text>

      {/* Lot details */}
      <Text style={{ ...body, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
        {`Wine: ${lot.name ?? '—'}`}
      </Text>
      <Text style={{ ...body, marginBottom: 5 }}>
        {`Batch : ${lot.code ?? '—'},  Vessel : ${vesselCode(lot, bond)},  Volume : ${lotVolumeStr(lot)} litres`}
      </Text>

      <Text style={{ ...body, marginBottom: 4 }}>Despatch on Consignment Note:</Text>

      {/* Clause 1 — single flowing paragraph with hanging number */}
      <View style={{ flexDirection: 'row', marginBottom: 3 }}>
        <Text style={{ ...body, width: 14 }}>1.</Text>
        <Text style={{ ...body, flex: 1 }}>
          {'has been processed at BURONGA HILL WINERY in accordance with the Food Standards Australia New Zealand (FSANZ), Standard 4.5.1 - Wine Production (Australia Only)'}
        </Text>
      </View>

      {/* Clause 2 */}
      <View style={{ flexDirection: 'row', marginBottom: 3 }}>
        <Text style={{ ...body, width: 14 }}>2.</Text>
        <Text style={{ ...body, flex: 1 }}>
          {'has all allergens added by BURONGA HILL WINERY as listed and required by Food Standards Australia New Zealand (FSANZ), Standard 1.2.3 Information requirements - warning statements, advisory statements and declarations.'}
        </Text>
      </View>

      {/* Clause 3 */}
      <View style={{ flexDirection: 'row', marginBottom: 0 }}>
        <Text style={{ ...body, width: 14 }}>3.</Text>
        <Text style={{ ...body, flex: 1 }}>
          {'and has the following composition (as required under the Label Integrity Program (LIP) contained in Wine Australia Regulations (2018)'}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ marginTop: 8, borderBottomWidth: 1, borderBottomColor: colors.border }} />
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function LipDeclaration({ data }: Props) {
  const generated = new Date().toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const varietalMap: Record<string, string> = {};
  data.varietals.forEach((v) => { varietalMap[v.id] = v.name; });

  const appellationMap: Record<string, string> = {};
  data.appellations.forEach((a) => { appellationMap[a.id] = a.name; });

  const indicatorMap: Record<string, string> = {};
  data.dryGoodIndicators.forEach((ind) => { if (ind.name) indicatorMap[ind.id] = ind.name; });

  const u = data.currentUser;
  const signatoryName = [u.firstName, u.lastName].filter(Boolean).join(' ')
    || u.name
    || '___________________________';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Declaration header — first page only */}
        <DeclarationBlock lot={data.lot} bond={data.bond} generated={generated} signatoryName={signatoryName} />

        <Text style={styles.sectionTitle}>1. Lot Information</Text>
        <LotInfoSection lot={data.lot} />

        <Text style={styles.sectionTitle}>2. Juice / Wine Composition</Text>
        <CompositionSection
          data={data.componentsSummary}
          varietalMap={varietalMap}
          appellationMap={appellationMap}
        />

        <Text style={styles.sectionTitle}>3. Block Components</Text>
        <BlockComponentsSection data={data.blockComponents} />

        <Text style={styles.sectionTitle}>4. Additives &amp; Allergens</Text>
        <AdditivesSection
          data={data.additives}
          additiveProducts={data.additiveProducts}
          indicatorMap={indicatorMap}
        />

        <Text style={styles.sectionTitle}>5. Lab Analyses</Text>
        <AnalysesSection data={data.analyses} />

        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 8,
              color: '#94a3b8',
              fontFamily: 'Helvetica-Oblique',
              textAlign: 'center',
            }}
          >
            This document is generated from InnoVint data and is intended for internal use only.
          </Text>
        </View>

        <PageFooter reportType="LIP Declaration" />
      </Page>
    </Document>
  );
}
