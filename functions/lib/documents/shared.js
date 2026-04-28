"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = exports.colors = void 0;
exports.fmtPct = fmtPct;
exports.fmtLitres = fmtLitres;
exports.formatDate = formatDate;
exports.toPct = toPct;
exports.PageHeader = PageHeader;
exports.PageFooter = PageFooter;
exports.LotInfoSection = LotInfoSection;
exports.CompositionSection = CompositionSection;
exports.BlockComponentsSection = BlockComponentsSection;
exports.AdditivesSection = AdditivesSection;
exports.AnalysesSection = AnalysesSection;
const react_1 = __importDefault(require("react"));
const renderer_1 = require("@react-pdf/renderer");
// ─── Colors & styles ──────────────────────────────────────────────────────────
exports.colors = {
    dark: '#1e293b',
    medium: '#475569',
    light: '#94a3b8',
    border: '#e2e8f0',
    bg: '#f8fafc',
    white: '#ffffff',
    accent: '#1e3a8a',
    allergen: '#dc2626',
};
exports.styles = renderer_1.StyleSheet.create({
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
function fmtPct(n) {
    return n.toFixed(2);
}
function fmtLitres(n) {
    return new Intl.NumberFormat('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}
function formatDate(raw) {
    if (!raw)
        return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime()))
        return raw;
    return d.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
function toPct(row) {
    var _a, _b;
    const raw = (_b = (_a = row.percentage) !== null && _a !== void 0 ? _a : row.percent) !== null && _b !== void 0 ? _b : 0;
    return raw > 1 ? raw : raw * 100;
}
function PageHeader({ title, lotCode, generated }) {
    return (react_1.default.createElement(renderer_1.View, { style: exports.styles.header, fixed: true },
        react_1.default.createElement(renderer_1.Text, { style: exports.styles.headerTitle }, title),
        lotCode ? (react_1.default.createElement(renderer_1.Text, { style: exports.styles.headerMeta },
            "Lot: ",
            lotCode)) : null,
        react_1.default.createElement(renderer_1.Text, { style: exports.styles.headerMeta },
            "Generated: ",
            generated)));
}
function PageFooter({ reportType }) {
    return (react_1.default.createElement(renderer_1.View, { style: exports.styles.footer, fixed: true },
        react_1.default.createElement(renderer_1.Text, null,
            reportType,
            " \u2014 Confidential"),
        react_1.default.createElement(renderer_1.Text, { render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` })));
}
// ─── Section 1: Lot Information ───────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (react_1.default.createElement(renderer_1.View, { style: exports.styles.infoRow },
        react_1.default.createElement(renderer_1.Text, { style: exports.styles.infoLabel }, label),
        value ? (react_1.default.createElement(renderer_1.Text, { style: exports.styles.infoValue }, value)) : (react_1.default.createElement(renderer_1.Text, { style: exports.styles.infoValueEmpty }, "\u2014"))));
}
function LotInfoSection({ lot }) {
    return (react_1.default.createElement(renderer_1.View, null,
        react_1.default.createElement(InfoRow, { label: "Lot Code", value: lot.code }),
        react_1.default.createElement(InfoRow, { label: "Lot Name", value: lot.name })));
}
function calcLitres(row) {
    var _a;
    const v = (_a = row.liters) !== null && _a !== void 0 ? _a : row.litres;
    return v != null ? Number(v) : undefined;
}
function CompTable({ title, rows }) {
    const showLitres = rows.some((r) => r.litres != null);
    const total = rows.reduce((s, r) => s + r.pct, 0);
    const totalL = showLitres
        ? rows.reduce((s, r) => { var _a; return s + ((_a = r.litres) !== null && _a !== void 0 ? _a : 0); }, 0)
        : undefined;
    return (react_1.default.createElement(renderer_1.View, { style: exports.styles.compCard },
        react_1.default.createElement(renderer_1.Text, { style: exports.styles.compCardTitle }, title),
        react_1.default.createElement(renderer_1.View, { style: exports.styles.tableHeaderRow },
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '12%', textAlign: 'right' }] }, "%"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { flex: 1, paddingLeft: 6 }] }, "Name"),
            showLitres ? (react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '20%', textAlign: 'right' }] }, "Litres")) : null),
        rows.map((r, i) => (react_1.default.createElement(renderer_1.View, { key: i, style: exports.styles.tableRow },
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { width: '12%', textAlign: 'right' }] }, fmtPct(r.pct)),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { flex: 1, paddingLeft: 6 }] }, r.label),
            showLitres ? (react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '20%', textAlign: 'right' }] }, r.litres != null ? fmtLitres(r.litres) : '—')) : null))),
        react_1.default.createElement(renderer_1.View, { style: [
                exports.styles.tableRow,
                { borderTopWidth: 1, borderTopColor: '#e2e8f0' },
            ] },
            react_1.default.createElement(renderer_1.Text, { style: [
                    exports.styles.tableCell,
                    { width: '12%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                ] }, fmtPct(total)),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { flex: 1, paddingLeft: 6 }] }),
            showLitres ? (react_1.default.createElement(renderer_1.Text, { style: [
                    exports.styles.tableCellMuted,
                    { width: '20%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                ] }, totalL != null ? fmtLitres(totalL) : '')) : null)));
}
function CompositionSection({ data, varietalMap, appellationMap, }) {
    var _a, _b, _c;
    const vintages = (_a = data.vintages) !== null && _a !== void 0 ? _a : [];
    const varietalList = (_b = data.varietals) !== null && _b !== void 0 ? _b : [];
    const appellationList = (_c = data.appellations) !== null && _c !== void 0 ? _c : [];
    if (!vintages.length && !varietalList.length && !appellationList.length) {
        return react_1.default.createElement(renderer_1.Text, { style: exports.styles.emptyNote }, "No composition data available.");
    }
    const vintageRows = vintages.map((v) => {
        var _a, _b;
        return ({
            label: String((_b = (_a = v.vintage) !== null && _a !== void 0 ? _a : v.year) !== null && _b !== void 0 ? _b : '—'),
            pct: toPct(v),
            litres: calcLitres(v),
        });
    });
    const varietalRows = varietalList.map((v) => {
        var _a, _b, _c, _d;
        const id = String((_b = (_a = v.varietalId) !== null && _a !== void 0 ? _a : v.id) !== null && _b !== void 0 ? _b : '');
        const name = ((_d = (_c = varietalMap[id]) !== null && _c !== void 0 ? _c : v.name) !== null && _d !== void 0 ? _d : id) || 'Unknown';
        return { label: name, pct: toPct(v), litres: calcLitres(v) };
    });
    const appellationRows = appellationList.map((app, i) => {
        var _a, _b, _c, _d;
        const id = String((_b = (_a = app.appellationId) !== null && _a !== void 0 ? _a : app.id) !== null && _b !== void 0 ? _b : '');
        const name = ((_d = (_c = appellationMap[id]) !== null && _c !== void 0 ? _c : app.name) !== null && _d !== void 0 ? _d : id) || `Appellation ${i + 1}`;
        return { label: name, pct: toPct(app), litres: calcLitres(app) };
    });
    // Sub-appellations (flattened)
    const subAppRows = [];
    appellationList.forEach((app) => {
        var _a;
        ((_a = app.subAppellations) !== null && _a !== void 0 ? _a : []).forEach((sub) => {
            var _a, _b, _c, _d;
            const sid = String((_b = (_a = sub.appellationId) !== null && _a !== void 0 ? _a : sub.id) !== null && _b !== void 0 ? _b : '');
            const sname = ((_d = (_c = appellationMap[sid]) !== null && _c !== void 0 ? _c : sub.name) !== null && _d !== void 0 ? _d : sid) || '—';
            subAppRows.push({ label: `  ${sname}`, pct: toPct(sub), litres: calcLitres(sub) });
        });
    });
    return (react_1.default.createElement(renderer_1.View, null,
        vintageRows.length > 0 ? (react_1.default.createElement(CompTable, { title: "Vintage", rows: vintageRows })) : null,
        varietalRows.length > 0 ? (react_1.default.createElement(CompTable, { title: "Varietal", rows: varietalRows })) : null,
        appellationRows.length > 0 ? (react_1.default.createElement(CompTable, { title: "Appellation (GI)", rows: appellationRows })) : null,
        subAppRows.length > 0 ? (react_1.default.createElement(CompTable, { title: "Sub-Appellation", rows: subAppRows })) : null));
}
function BlockComponentsSection({ data }) {
    if (data.length === 0) {
        return react_1.default.createElement(renderer_1.Text, { style: exports.styles.emptyNote }, "No block components recorded.");
    }
    function toPctNum(pct) {
        if (pct == null)
            return 0;
        return pct > 1 ? pct : pct * 100;
    }
    // Roll up percentages by tag
    const tagTotals = {};
    data.forEach((row) => {
        var _a;
        const tags = ((_a = row.tags) !== null && _a !== void 0 ? _a : []);
        const pct = toPctNum(row.percentage);
        tags.forEach((tag) => {
            var _a;
            tagTotals[tag] = ((_a = tagTotals[tag]) !== null && _a !== void 0 ? _a : 0) + pct;
        });
    });
    const tagEntries = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);
    return (react_1.default.createElement(renderer_1.View, null,
        react_1.default.createElement(renderer_1.View, { style: exports.styles.tableHeaderRow },
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '18%' }] }, "Vineyard"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '14%' }] }, "Block"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '22%' }] }, "Tags"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '16%' }] }, "Varietal"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '16%' }] }, "Appellation"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '8%', textAlign: 'center' }] }, "Vintage"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '6%', textAlign: 'right' }] }, "%")),
        data.map((row, i) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const tags = ((_a = row.tags) !== null && _a !== void 0 ? _a : []);
            return (react_1.default.createElement(renderer_1.View, { key: i, style: exports.styles.tableRow },
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { width: '18%' }] }, (_c = (_b = row.vineyard) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : '—'),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '14%' }] }, (_e = (_d = row.block) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : '—'),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '22%' }] }, tags.length > 0 ? tags.join(', ') : '—'),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '16%' }] }, (_g = (_f = row.varietal) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : '—'),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '16%' }] }, (_j = (_h = row.appellation) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : '—'),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '8%', textAlign: 'center' }] }, row.vintage != null ? String(row.vintage) : '—'),
                react_1.default.createElement(renderer_1.Text, { style: [
                        exports.styles.tableCell,
                        { width: '6%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                    ] }, fmtPct(toPctNum(row.percentage)))));
        }),
        tagEntries.length > 0 ? (react_1.default.createElement(renderer_1.View, { style: { marginTop: 6 } },
            react_1.default.createElement(renderer_1.Text, { style: [
                    exports.styles.compCardTitle,
                    { marginBottom: 4, backgroundColor: 'transparent', borderBottomWidth: 0 },
                ] }, "SWA Status"),
            react_1.default.createElement(renderer_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 } }, tagEntries.map(([tag, pct], i) => (react_1.default.createElement(renderer_1.View, { key: i, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#bfdbfe',
                    borderRadius: 4,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    backgroundColor: '#eff6ff',
                } },
                react_1.default.createElement(renderer_1.Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' } }, tag),
                react_1.default.createElement(renderer_1.Text, { style: { fontSize: 8, color: '#2563eb', marginLeft: 4 } },
                    fmtPct(pct),
                    "%"))))))) : null));
}
// ─── Section 4: Additives / Allergens ────────────────────────────────────────
function resolveAdditiveName(additive, productMap) {
    var _a, _b, _c, _d;
    const refId = String((_b = (_a = additive.additiveId) !== null && _a !== void 0 ? _a : additive.id) !== null && _b !== void 0 ? _b : '');
    if (refId && productMap[refId])
        return productMap[refId];
    return String(((_d = (_c = additive.name) !== null && _c !== void 0 ? _c : additive.additiveName) !== null && _d !== void 0 ? _d : refId) || '—');
}
function resolveAmount(additive) {
    var _a, _b, _c;
    const raw = additive.amount;
    if (raw == null)
        return { value: '—', unit: '—' };
    if (typeof raw === 'object') {
        return {
            value: raw.value != null ? String(raw.value) : '—',
            unit: (_a = raw.unit) !== null && _a !== void 0 ? _a : '—',
        };
    }
    return {
        value: String(raw),
        unit: String((_c = (_b = additive.unitOfMeasure) !== null && _b !== void 0 ? _b : additive.uom) !== null && _c !== void 0 ? _c : '—'),
    };
}
const NON_ALLERGEN_LABELS = new Set(['vegan', 'organic']);
function resolveAllergen(additive, indicatorNames) {
    if (indicatorNames.length > 0) {
        return indicatorNames.some((n) => !NON_ALLERGEN_LABELS.has(n.toLowerCase()));
    }
    if (additive.isAllergen != null)
        return Boolean(additive.isAllergen);
    if (additive.allergen != null)
        return Boolean(additive.allergen);
    return false;
}
function resolveIndicators(additive, indicatorMap) {
    const embedded = additive.indicators;
    if (Array.isArray(embedded) && embedded.length > 0) {
        const names = embedded
            .map((ind) => {
            var _a, _b, _c, _d;
            if (!ind || typeof ind !== 'object')
                return String(ind !== null && ind !== void 0 ? ind : '');
            const i = ind;
            const id = String((_a = i.id) !== null && _a !== void 0 ? _a : '');
            if (id && indicatorMap[id])
                return indicatorMap[id];
            return String((_d = (_c = (_b = i.name) !== null && _b !== void 0 ? _b : i.abbreviation) !== null && _c !== void 0 ? _c : id) !== null && _d !== void 0 ? _d : '');
        })
            .filter(Boolean);
        if (names.length > 0)
            return names;
    }
    if (Array.isArray(additive.indicatorIds) && additive.indicatorIds.length > 0) {
        return additive.indicatorIds.map((id) => { var _a; return (_a = indicatorMap[String(id)]) !== null && _a !== void 0 ? _a : String(id); });
    }
    return [];
}
function AdditivesSection({ data, additiveProducts, indicatorMap }) {
    if (data.length === 0) {
        return react_1.default.createElement(renderer_1.Text, { style: exports.styles.emptyNote }, "No additives recorded.");
    }
    const productMap = {};
    additiveProducts.forEach((p) => {
        var _a;
        productMap[p.id] = (_a = p.productName) !== null && _a !== void 0 ? _a : '';
    });
    return (react_1.default.createElement(renderer_1.View, null,
        react_1.default.createElement(renderer_1.View, { style: exports.styles.tableHeaderRow },
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '28%' }] }, "Additive"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '10%', textAlign: 'right' }] }, "Amount"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '10%' }] }, "Unit"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '10%', textAlign: 'center' }] }, "Allergen"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { flex: 1 }] }, "Allergen Type")),
        data.map((additive, i) => {
            const { value, unit } = resolveAmount(additive);
            const indicators = resolveIndicators(additive, indicatorMap);
            const isAllergen = resolveAllergen(additive, indicators);
            return (react_1.default.createElement(renderer_1.View, { key: i, style: exports.styles.tableRow },
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { width: '28%', fontFamily: 'Helvetica-Bold' }] }, resolveAdditiveName(additive, productMap)),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { width: '10%', textAlign: 'right' }] }, value),
                react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '10%' }] }, unit),
                react_1.default.createElement(renderer_1.Text, { style: [
                        exports.styles.tableCell,
                        {
                            width: '10%',
                            textAlign: 'center',
                            color: isAllergen ? exports.colors.allergen : exports.colors.medium,
                            fontFamily: isAllergen ? 'Helvetica-Bold' : 'Helvetica',
                        },
                    ] }, isAllergen ? 'Yes' : 'No'),
                react_1.default.createElement(renderer_1.Text, { style: [
                        exports.styles.tableCell,
                        {
                            flex: 1,
                            color: indicators.length > 0 ? exports.colors.allergen : exports.colors.light,
                        },
                    ] }, indicators.length > 0 ? indicators.join(', ') : '—')));
        })));
}
// ─── Section 5: Lab Analyses ──────────────────────────────────────────────────
function resolveAnalysisDate(a) {
    var _a, _b, _c;
    return (_c = (_b = (_a = a.recordedAt) !== null && _a !== void 0 ? _a : a.date) !== null && _b !== void 0 ? _b : a.analysisDate) !== null && _c !== void 0 ? _c : a.createdAt;
}
function resolveAnalysisName(a) {
    var _a, _b, _c;
    const type = a.analysisType;
    if (type)
        return String((_b = (_a = type.name) !== null && _a !== void 0 ? _a : type.abbreviation) !== null && _b !== void 0 ? _b : '—');
    return String((_c = a.analysisName) !== null && _c !== void 0 ? _c : '—');
}
function resolveAnalysisValue(a) {
    var _a;
    const v = (_a = a.value) !== null && _a !== void 0 ? _a : a.result;
    return v != null ? String(v) : '—';
}
function resolveAnalysisUnit(a) {
    var _a, _b, _c;
    if ((_a = a.unit) === null || _a === void 0 ? void 0 : _a.unit)
        return a.unit.unit;
    const type = a.analysisType;
    if (type === null || type === void 0 ? void 0 : type.unit)
        return String(type.unit);
    return String((_c = (_b = a.unitOfMeasure) !== null && _b !== void 0 ? _b : a.uom) !== null && _c !== void 0 ? _c : '—');
}
function AnalysesSection({ data }) {
    var _a, _b;
    if (data.length === 0) {
        return react_1.default.createElement(renderer_1.Text, { style: exports.styles.emptyNote }, "No lab analyses recorded.");
    }
    // Keep only the most recent entry per analysis type
    const latestByType = new Map();
    for (const a of data) {
        const key = resolveAnalysisName(a);
        const existing = latestByType.get(key);
        if (!existing) {
            latestByType.set(key, a);
        }
        else {
            const ta = new Date((_a = resolveAnalysisDate(a)) !== null && _a !== void 0 ? _a : '').getTime() || 0;
            const te = new Date((_b = resolveAnalysisDate(existing)) !== null && _b !== void 0 ? _b : '').getTime() || 0;
            if (ta > te)
                latestByType.set(key, a);
        }
    }
    const sorted = [...latestByType.values()].sort((a, b) => {
        var _a, _b;
        const ta = new Date((_a = resolveAnalysisDate(a)) !== null && _a !== void 0 ? _a : '').getTime() || 0;
        const tb = new Date((_b = resolveAnalysisDate(b)) !== null && _b !== void 0 ? _b : '').getTime() || 0;
        return tb - ta;
    });
    return (react_1.default.createElement(renderer_1.View, null,
        react_1.default.createElement(renderer_1.View, { style: exports.styles.tableHeaderRow },
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { flex: 1 }] }, "Analysis"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '14%', textAlign: 'right' }] }, "Value"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '14%' }] }, "Unit"),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableHeaderCell, { width: '22%' }] }, "Date")),
        sorted.map((analysis, i) => (react_1.default.createElement(renderer_1.View, { key: i, style: exports.styles.tableRow },
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCell, { flex: 1 }] }, resolveAnalysisName(analysis)),
            react_1.default.createElement(renderer_1.Text, { style: [
                    exports.styles.tableCell,
                    { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                ] }, resolveAnalysisValue(analysis)),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '14%' }] }, resolveAnalysisUnit(analysis)),
            react_1.default.createElement(renderer_1.Text, { style: [exports.styles.tableCellMuted, { width: '22%' }] }, formatDate(resolveAnalysisDate(analysis))))))));
}
//# sourceMappingURL=shared.js.map