"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = void 0;
const functions = __importStar(require("firebase-functions"));
const renderer_1 = require("@react-pdf/renderer");
const react_1 = __importDefault(require("react"));
const fetch_1 = require("./fetch");
const LipDeclaration_1 = require("./documents/LipDeclaration");
const CompositionDetails_1 = require("./documents/CompositionDetails");
const DispatchApproval_1 = require("./documents/DispatchApproval");
const VALID_REPORT_TYPES = [
    'lip-declaration',
    'composition-details',
    'dispatch-approval',
];
exports.generatePdf = functions
    .runWith({ timeoutSeconds: 300, memory: '512MB' })
    .https.onCall(async (data) => {
    var _a;
    const { token, lotId, reportType } = data !== null && data !== void 0 ? data : {};
    if (!token || typeof token !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'token is required');
    }
    if (!lotId || typeof lotId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'lotId is required');
    }
    if (!VALID_REPORT_TYPES.includes(reportType)) {
        throw new functions.https.HttpsError('invalid-argument', `reportType must be one of: ${VALID_REPORT_TYPES.join(', ')}`);
    }
    let allData;
    try {
        allData = await (0, fetch_1.fetchAllLotData)(token, lotId);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new functions.https.HttpsError('unavailable', `Failed to fetch lot data: ${msg}`);
    }
    const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
    const code = ((_a = allData.lot.code) !== null && _a !== void 0 ? _a : lotId).replace(/[^a-zA-Z0-9-_]/g, '_');
    let doc;
    let filename;
    if (reportType === 'lip-declaration') {
        doc = react_1.default.createElement(LipDeclaration_1.LipDeclaration, { data: allData });
        filename = `LIP-Declaration-${code}-${timestamp}.pdf`;
    }
    else if (reportType === 'composition-details') {
        doc = react_1.default.createElement(CompositionDetails_1.CompositionDetails, { data: allData });
        filename = `Composition-Details-${code}-${timestamp}.pdf`;
    }
    else {
        doc = react_1.default.createElement(DispatchApproval_1.DispatchApproval, { data: allData });
        filename = `Dispatch-Approval-${code}-${timestamp}.pdf`;
    }
    let buffer;
    try {
        buffer = await (0, renderer_1.renderToBuffer)(doc);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new functions.https.HttpsError('internal', `PDF rendering failed: ${msg}`);
    }
    return { pdf: buffer.toString('base64'), filename };
});
//# sourceMappingURL=index.js.map