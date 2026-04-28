import * as functions from 'firebase-functions';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { fetchAllLotData } from './fetch';
import { LipDeclaration } from './documents/LipDeclaration';
import { CompositionDetails } from './documents/CompositionDetails';
import { DispatchApproval } from './documents/DispatchApproval';

type ReportType = 'lip-declaration' | 'composition-details' | 'dispatch-approval';

interface GeneratePdfRequest {
  token: string;
  lotId: string;
  reportType: ReportType;
}

interface GeneratePdfResponse {
  pdf: string;
  filename: string;
}

const VALID_REPORT_TYPES: ReportType[] = [
  'lip-declaration',
  'composition-details',
  'dispatch-approval',
];

export const generatePdf = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onCall(
    async (data: GeneratePdfRequest): Promise<GeneratePdfResponse> => {
      const { token, lotId, reportType } = data ?? {};

      if (!token || typeof token !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'token is required',
        );
      }
      if (!lotId || typeof lotId !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'lotId is required',
        );
      }
      if (!VALID_REPORT_TYPES.includes(reportType)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `reportType must be one of: ${VALID_REPORT_TYPES.join(', ')}`,
        );
      }

      let allData;
      try {
        allData = await fetchAllLotData(token, lotId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new functions.https.HttpsError(
          'unavailable',
          `Failed to fetch lot data: ${msg}`,
        );
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      const code = (allData.lot.code ?? lotId).replace(/[^a-zA-Z0-9-_]/g, '_');

      let doc: React.ReactElement;
      let filename: string;

      if (reportType === 'lip-declaration') {
        doc = React.createElement(LipDeclaration, { data: allData });
        filename = `LIP-Declaration-${code}-${timestamp}.pdf`;
      } else if (reportType === 'composition-details') {
        doc = React.createElement(CompositionDetails, { data: allData });
        filename = `Composition-Details-${code}-${timestamp}.pdf`;
      } else {
        doc = React.createElement(DispatchApproval, { data: allData });
        filename = `Dispatch-Approval-${code}-${timestamp}.pdf`;
      }

      let buffer: Buffer;
      try {
        buffer = await renderToBuffer(doc);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new functions.https.HttpsError(
          'internal',
          `PDF rendering failed: ${msg}`,
        );
      }

      return { pdf: buffer.toString('base64'), filename };
    },
  );
