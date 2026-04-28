import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Paste your Firebase project config from the Firebase Console.
// Project Settings → General → Your apps → Firebase SDK snippet → Config
// For local emulator development any values work as long as projectId matches .firebaserc.
// Replace with real values from Firebase Console when deploying to production.
const firebaseConfig = {
  apiKey: 'local-api-key',
  authDomain: 'lip-app-local.firebaseapp.com',
  projectId: 'lip-app-local',
  storageBucket: 'lip-app-local.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000',
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to the local emulator when running in dev mode
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// ─── Typed callable ───────────────────────────────────────────────────────────

export type ReportType =
  | 'lip-declaration'
  | 'composition-details'
  | 'dispatch-approval';

export interface GeneratePdfRequest {
  token: string;
  lotId: string;
  reportType: ReportType;
}

export interface GeneratePdfResponse {
  pdf: string;     // base64-encoded PDF bytes
  filename: string;
}

export const generatePdfCallable = httpsCallable<
  GeneratePdfRequest,
  GeneratePdfResponse
>(functions, 'generatePdf');
