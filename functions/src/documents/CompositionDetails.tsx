import React from 'react';
import { Document, Page, Text } from '@react-pdf/renderer';
import type { AllLotData } from '../fetch';
import {
  styles,
  PageHeader,
  PageFooter,
  CompositionSection,
  BlockComponentsSection,
} from './shared';

interface Props {
  data: AllLotData;
}

export function CompositionDetails({ data }: Props) {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader
          title="Composition Details Report"
          lotCode={data.lot.code}
          generated={generated}
        />

        <Text style={styles.sectionTitle}>2. Juice / Wine Composition</Text>
        <CompositionSection
          data={data.componentsSummary}
          varietalMap={varietalMap}
          appellationMap={appellationMap}
        />

        <Text style={styles.sectionTitle}>3. Block Components</Text>
        <BlockComponentsSection data={data.blockComponents} />

        <PageFooter reportType="Composition Details" />
      </Page>
    </Document>
  );
}
