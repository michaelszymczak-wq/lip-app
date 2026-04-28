"use strict";
// InnoVint API Client — server-side port of src/api/innovint.ts
// Types are duplicated intentionally to avoid workspace complexity.
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLot = fetchLot;
exports.fetchVarietals = fetchVarietals;
exports.fetchAppellations = fetchAppellations;
exports.fetchComponentsSummary = fetchComponentsSummary;
exports.fetchAdditives = fetchAdditives;
exports.fetchBlock = fetchBlock;
exports.fetchBlockComponents = fetchBlockComponents;
exports.fetchAdditiveProducts = fetchAdditiveProducts;
exports.fetchDryGoodIndicators = fetchDryGoodIndicators;
exports.fetchCurrentUser = fetchCurrentUser;
exports.fetchBond = fetchBond;
exports.fetchAnalyses = fetchAnalyses;
exports.fetchAllLotData = fetchAllLotData;
const WINERY_ID = 'wnry_0ZLW59P4EM5ZENE7X6RV8KJD';
const BASE_URL = 'https://sutter.staging.innovint.us/api/v1';
const DEFAULT_PAGE_SIZE = 200;
class InnoVintError extends Error {
    constructor(message, status, endpoint) {
        super(message);
        this.name = 'InnoVintError';
        this.status = status;
        this.endpoint = endpoint;
    }
}
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchWithRetry(url, options, endpoint) {
    while (true) {
        const res = await fetch(url, options);
        if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After');
            const waitSeconds = retryAfter ? parseFloat(retryAfter) : 60;
            await sleep(waitSeconds * 1000);
            continue;
        }
        if (!res.ok) {
            throw new InnoVintError(`Request failed: ${res.status} ${res.statusText}`, res.status, endpoint);
        }
        return res;
    }
}
function buildHeaders(token) {
    const authValue = token.startsWith('Access-Token ') || token.startsWith('Bearer ')
        ? token
        : `Access-Token ${token}`;
    return { Authorization: authValue };
}
function unwrap(raw) {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return raw.data;
    }
    return raw;
}
async function apiGet(token, path) {
    const url = `${BASE_URL}${path}`;
    const res = await fetchWithRetry(url, { headers: buildHeaders(token) }, path);
    const json = await res.json();
    return unwrap(json);
}
async function apiGetAll(token, path, pageSize = DEFAULT_PAGE_SIZE) {
    var _a, _b, _c, _d, _e;
    const allItems = [];
    let offset = 0;
    while (true) {
        const separator = path.includes('?') ? '&' : '?';
        const url = `${BASE_URL}${path}${separator}limit=${pageSize}&offset=${offset}`;
        const res = await fetchWithRetry(url, { headers: buildHeaders(token) }, path);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const envelope = await res.json();
        if (Array.isArray(envelope)) {
            allItems.push(...envelope.map((x) => unwrap(x)));
            break;
        }
        // { pagination: { count, next }, results: [...] }  — lots
        if (envelope.results !== undefined) {
            const raw = ((_a = envelope.results) !== null && _a !== void 0 ? _a : []);
            const items = raw.map((x) => unwrap(x));
            allItems.push(...items);
            const total = (_c = (_b = envelope.pagination) === null || _b === void 0 ? void 0 : _b.count) !== null && _c !== void 0 ? _c : 0;
            const fetched = offset + items.length;
            if (!((_d = envelope.pagination) === null || _d === void 0 ? void 0 : _d.next) || fetched >= total || items.length < pageSize)
                break;
            offset += pageSize;
            continue;
        }
        // { data: [...], meta: { total } }  — additives, analyses, varietals, appellations
        const raw = ((_e = envelope.data) !== null && _e !== void 0 ? _e : []);
        const items = raw.map((x) => unwrap(x));
        allItems.push(...items);
        const meta = envelope.meta;
        if (!meta)
            break;
        const fetched = offset + items.length;
        if (fetched >= meta.total || items.length < pageSize)
            break;
        offset += pageSize;
    }
    return allItems;
}
// ─── Individual fetchers ──────────────────────────────────────────────────────
async function fetchLot(token, lotId) {
    return apiGet(token, `/wineries/${WINERY_ID}/lots/${lotId}`);
}
async function fetchVarietals(token) {
    return apiGetAll(token, '/varietals');
}
async function fetchAppellations(token) {
    return apiGetAll(token, '/appellations');
}
async function fetchComponentsSummary(token, lotId) {
    return apiGet(token, `/wineries/${WINERY_ID}/lots/${lotId}/componentsSummary`);
}
async function fetchAdditives(token, lotId) {
    return apiGetAll(token, `/wineries/${WINERY_ID}/lots/${lotId}/additives`);
}
async function fetchBlock(token, blockId) {
    return apiGet(token, `/wineries/${WINERY_ID}/blocks/${blockId}`);
}
async function fetchBlockComponents(token, lotId) {
    return apiGetAll(token, `/wineries/${WINERY_ID}/lots/${lotId}/blockComponents`);
}
async function fetchAdditiveProducts(token) {
    return apiGetAll(token, `/wineries/${WINERY_ID}/additives`);
}
async function fetchDryGoodIndicators(token) {
    return apiGetAll(token, '/dryGoodIndicators');
}
async function fetchCurrentUser(token) {
    try {
        return await apiGet(token, '/me');
    }
    catch (_a) {
        return {};
    }
}
async function fetchBond(token, bondId) {
    try {
        return await apiGet(token, `/wineries/${WINERY_ID}/bonds/${bondId}`);
    }
    catch (_a) {
        return {};
    }
}
async function fetchAnalyses(token, lotId) {
    return apiGetAll(token, `/wineries/${WINERY_ID}/lots/${lotId}/analyses`);
}
async function fetchAllLotData(token, lotId) {
    const [lot, componentsSummary, blockComponentsRaw, additives, analyses, varietals, appellations, additiveProducts, dryGoodIndicators, currentUser,] = await Promise.all([
        fetchLot(token, lotId),
        fetchComponentsSummary(token, lotId),
        fetchBlockComponents(token, lotId),
        fetchAdditives(token, lotId),
        fetchAnalyses(token, lotId),
        fetchVarietals(token),
        fetchAppellations(token),
        fetchAdditiveProducts(token),
        fetchDryGoodIndicators(token),
        fetchCurrentUser(token),
    ]);
    // Fetch bond + block tags in parallel
    const uniqueBlockIds = [
        ...new Set(blockComponentsRaw
            .map((r) => { var _a; return (_a = r.block) === null || _a === void 0 ? void 0 : _a.id; })
            .filter((id) => !!id)),
    ];
    const [blockTagResults, bond] = await Promise.all([
        Promise.all(uniqueBlockIds.map((id) => fetchBlock(token, id)
            .then((b) => { var _a; return ({ id, tags: (_a = b.tags) !== null && _a !== void 0 ? _a : [] }); })
            .catch(() => ({ id, tags: [] })))),
        lot.bondId ? fetchBond(token, lot.bondId) : Promise.resolve({}),
    ]);
    const blockTagMap = {};
    blockTagResults.forEach(({ id, tags }) => {
        blockTagMap[id] = tags;
    });
    // Enrich block components with tags
    const blockComponents = blockComponentsRaw.map((bc) => {
        var _a, _b, _c;
        return (Object.assign(Object.assign({}, bc), { tags: (_c = blockTagMap[(_b = (_a = bc.block) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '']) !== null && _c !== void 0 ? _c : [] }));
    });
    return {
        lot,
        bond,
        componentsSummary,
        blockComponents,
        additives,
        analyses,
        varietals,
        appellations,
        additiveProducts,
        dryGoodIndicators,
        currentUser,
    };
}
//# sourceMappingURL=fetch.js.map