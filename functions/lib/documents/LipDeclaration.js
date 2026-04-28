"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LipDeclaration = LipDeclaration;
const react_1 = __importDefault(require("react"));
const renderer_1 = require("@react-pdf/renderer");
const shared_1 = require("./shared");
// ─── Volume helper ────────────────────────────────────────────────────────────
function lotVolumeStr(lot) {
    var _a;
    const vol = lot.volume;
    if (!vol || vol.value == null)
        return '___________';
    const v = vol.value;
    let litres;
    switch (((_a = vol.unit) !== null && _a !== void 0 ? _a : '').toLowerCase()) {
        case 'gal':
        case 'gallon':
        case 'gallons':
            litres = v * 3.78541;
            break;
        case 'hl':
        case 'hectolitre':
        case 'hectoliter':
            litres = v * 100;
            break;
        case 'ml':
            litres = v * 0.001;
            break;
        default: litres = v;
    }
    return (0, shared_1.fmtLitres)(litres);
}
// ─── Vessel code helper ───────────────────────────────────────────────────────
function vesselCode(lot, bond) {
    var _a, _b, _c;
    return (_c = (_b = (_a = bond.name) !== null && _a !== void 0 ? _a : bond.code) !== null && _b !== void 0 ? _b : lot.bondId) !== null && _c !== void 0 ? _c : '___________';
}
// ─── Declaration block (page 1 only) ─────────────────────────────────────────
function DeclarationBlock({ lot, bond, generated, signatoryName }) {
    var _a, _b, _c;
    const clause = {};
    void clause;
    const body = { fontSize: 9, color: shared_1.colors.dark, lineHeight: 1.4 };
    return (react_1.default.createElement(renderer_1.View, { style: { marginBottom: 10 } },
        react_1.default.createElement(renderer_1.Text, { style: {
                fontSize: 13,
                fontFamily: 'Helvetica-Bold',
                textAlign: 'center',
                color: shared_1.colors.accent,
                marginBottom: 5,
                letterSpacing: 0.5,
            } }, "LIP DECLARATION \u2013 WINE / JUICE"),
        react_1.default.createElement(renderer_1.Text, { style: { fontSize: 8, color: shared_1.colors.medium, textAlign: 'right', marginBottom: 6 } }, `Lot: ${(_a = lot.code) !== null && _a !== void 0 ? _a : '—'}   |   Generated: ${generated}`),
        react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { marginBottom: 4 }) }, `I, ${signatoryName}, being ccw of BURONGA HILL WINERY declare that`),
        react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { fontFamily: 'Helvetica-Bold', marginBottom: 2 }) }, `Wine: ${(_b = lot.name) !== null && _b !== void 0 ? _b : '—'}`),
        react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { marginBottom: 5 }) }, `Batch : ${(_c = lot.code) !== null && _c !== void 0 ? _c : '—'},  Vessel : ${vesselCode(lot, bond)},  Volume : ${lotVolumeStr(lot)} litres`),
        react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { marginBottom: 4 }) }, "Despatch on Consignment Note:"),
        react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row', marginBottom: 3 } },
            react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { width: 14 }) }, "1."),
            react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { flex: 1 }) }, 'has been processed at BURONGA HILL WINERY in accordance with the Food Standards Australia New Zealand (FSANZ), Standard 4.5.1 - Wine Production (Australia Only)')),
        react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row', marginBottom: 3 } },
            react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { width: 14 }) }, "2."),
            react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { flex: 1 }) }, 'has all allergens added by BURONGA HILL WINERY as listed and required by Food Standards Australia New Zealand (FSANZ), Standard 1.2.3 Information requirements - warning statements, advisory statements and declarations.')),
        react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row', marginBottom: 0 } },
            react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { width: 14 }) }, "3."),
            react_1.default.createElement(renderer_1.Text, { style: Object.assign(Object.assign({}, body), { flex: 1 }) }, 'and has the following composition (as required under the Label Integrity Program (LIP) contained in Wine Australia Regulations (2018)')),
        react_1.default.createElement(renderer_1.View, { style: { marginTop: 8, borderBottomWidth: 1, borderBottomColor: shared_1.colors.border } })));
}
// ─── Document ─────────────────────────────────────────────────────────────────
function LipDeclaration({ data }) {
    const generated = new Date().toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    const varietalMap = {};
    data.varietals.forEach((v) => { varietalMap[v.id] = v.name; });
    const appellationMap = {};
    data.appellations.forEach((a) => { appellationMap[a.id] = a.name; });
    const indicatorMap = {};
    data.dryGoodIndicators.forEach((ind) => { if (ind.name)
        indicatorMap[ind.id] = ind.name; });
    const u = data.currentUser;
    const signatoryName = [u.firstName, u.lastName].filter(Boolean).join(' ')
        || u.name
        || '___________________________';
    return (react_1.default.createElement(renderer_1.Document, null,
        react_1.default.createElement(renderer_1.Page, { size: "A4", style: shared_1.styles.page },
            react_1.default.createElement(DeclarationBlock, { lot: data.lot, bond: data.bond, generated: generated, signatoryName: signatoryName }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "1. Lot Information"),
            react_1.default.createElement(shared_1.LotInfoSection, { lot: data.lot }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "2. Juice / Wine Composition"),
            react_1.default.createElement(shared_1.CompositionSection, { data: data.componentsSummary, varietalMap: varietalMap, appellationMap: appellationMap }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "3. Block Components"),
            react_1.default.createElement(shared_1.BlockComponentsSection, { data: data.blockComponents }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "4. Additives & Allergens"),
            react_1.default.createElement(shared_1.AdditivesSection, { data: data.additives, additiveProducts: data.additiveProducts, indicatorMap: indicatorMap }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "5. Lab Analyses"),
            react_1.default.createElement(shared_1.AnalysesSection, { data: data.analyses }),
            react_1.default.createElement(renderer_1.View, { style: { marginTop: 20 } },
                react_1.default.createElement(renderer_1.Text, { style: {
                        fontSize: 8,
                        color: '#94a3b8',
                        fontFamily: 'Helvetica-Oblique',
                        textAlign: 'center',
                    } }, "This document is generated from InnoVint data and is intended for internal use only.")),
            react_1.default.createElement(shared_1.PageFooter, { reportType: "LIP Declaration" }))));
}
//# sourceMappingURL=LipDeclaration.js.map