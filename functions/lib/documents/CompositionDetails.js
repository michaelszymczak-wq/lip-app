"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositionDetails = CompositionDetails;
const react_1 = __importDefault(require("react"));
const renderer_1 = require("@react-pdf/renderer");
const shared_1 = require("./shared");
function CompositionDetails({ data }) {
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
    return (react_1.default.createElement(renderer_1.Document, null,
        react_1.default.createElement(renderer_1.Page, { size: "A4", style: shared_1.styles.page },
            react_1.default.createElement(shared_1.PageHeader, { title: "Composition Details Report", lotCode: data.lot.code, generated: generated }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "2. Juice / Wine Composition"),
            react_1.default.createElement(shared_1.CompositionSection, { data: data.componentsSummary, varietalMap: varietalMap, appellationMap: appellationMap }),
            react_1.default.createElement(renderer_1.Text, { style: shared_1.styles.sectionTitle }, "3. Block Components"),
            react_1.default.createElement(shared_1.BlockComponentsSection, { data: data.blockComponents }),
            react_1.default.createElement(shared_1.PageFooter, { reportType: "Composition Details" }))));
}
//# sourceMappingURL=CompositionDetails.js.map