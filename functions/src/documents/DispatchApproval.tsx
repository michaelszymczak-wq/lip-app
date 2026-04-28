import React from 'react';
import { Document, Page, Text } from '@react-pdf/renderer';
import type { AllLotData } from '../fetch';
import {
  styles,
  PageHeader,
  PageFooter,
  LotInfoSection,
  CompositionSection,
  AdditivesSection,
  AnalysesSection,
} from './shared';

interface Props {
  data: AllLotData;
}

export function DispatchApproval({ data }: Props) {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader
          title="Dispatch Approval Report"
          lotCode={data.lot.code}
          generated={generated}
        />

        <Text style={styles.sectionTitle}>1. Lot Information</Text>
        <LotInfoSection lot={data.lot} />

        <Text style={styles.sectionTitle}>2. Juice / Wine Composition</Text>
        <CompositionSection
          data={data.componentsSummary}
          varietalMap={varietalMap}
          appellationMap={appellationMap}
        />

        <Text style={styles.sectionTitle}>4. Additives &amp; Allergens</Text>
        <AdditivesSection
          data={data.additives}
          additiveProducts={data.additiveProducts}
          indicatorMap={indicatorMap}
        />

        <Text style={styles.sectionTitle}>5. Lab Analyses</Text>
        <AnalysesSection data={data.analyses} />

        <PageFooter reportType="Dispatch Approval" />
      </Page>
    </Document>
  );
}
