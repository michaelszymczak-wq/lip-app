// InnoVint API Client
// Every response is wrapped: { data: {...}, relationships: {...} }
// apiGet and apiGetAll both unwrap .data automatically.

export const WINERY_ID = 'wnry_0ZLW59P4EM5ZENE7X6RV8KJD';
const BASE_URL = 'https://sutter.staging.innovint.us/api/v1';
const DEFAULT_PAGE_SIZE = 200;

export class InnoVintError extends Error {
  status: number;
  endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'InnoVintError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  endpoint: string,
): Promise<Response> {
  while (true) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitSeconds = retryAfter ? parseFloat(retryAfter) : 60;
      await sleep(waitSeconds * 1000);
      continue;
    }
    if (!res.ok) {
      throw new InnoVintError(
        `Request failed: ${res.status} ${res.statusText}`,
        res.status,
        endpoint,
      );
    }
    return res;
  }
}

function buildHeaders(token: string): HeadersInit {
  const authValue =
    token.startsWith('Access-Token ') || token.startsWith('Bearer ')
      ? token
      : `Access-Token ${token}`;
  return { Authorization: authValue };
}

// Unwrap InnoVint's universal { data: {...}, relationships: {...} envelope
function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as Record<string, unknown>).data as T;
  }
  return raw as T;
}

// Single-resource GET — unwraps .data
export async function apiGet<T>(token: string, path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetchWithRetry(url, { headers: buildHeaders(token) }, path);
  const json = await res.json();
  return unwrap<T>(json);
}

// Paginated GET — unwraps .data from every list item
export async function apiGetAll<T>(
  token: string,
  path: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const allItems: T[] = [];
  let offset = 0;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${path}${separator}limit=${pageSize}&offset=${offset}`;
    const res = await fetchWithRetry(
      url,
      { headers: buildHeaders(token) },
      path,
    );
    const envelope = await res.json();

    if (Array.isArray(envelope)) {
      allItems.push(...envelope.map(unwrap<T>));
      break;
    }

    // { pagination: { count, next }, results: [...] }  — lots
    if (envelope.results !== undefined) {
      const raw = (envelope.results ?? []) as unknown[];
      const items = raw.map(unwrap<T>);
      allItems.push(...items);
      const total: number = envelope.pagination?.count ?? 0;
      const fetched = offset + items.length;
      if (!envelope.pagination?.next || fetched >= total || items.length < pageSize) break;
      offset += pageSize;
      continue;
    }

    // { data: [...], meta: { total } }  — additives, analyses, varietals, appellations
    const raw = (envelope.data ?? []) as unknown[];
    const items = raw.map(unwrap<T>);
    allItems.push(...items);
    const meta = envelope.meta;
    if (!meta) break;
    const fetched = offset + items.length;
    if (fetched >= meta.total || items.length < pageSize) break;
    offset += pageSize;
  }

  return allItems;
}

// ─── Resource types ───────────────────────────────────────────────────────────
// All fields are post-unwrap (i.e. what lives inside .data in the raw response)

export interface Lot {
  id?: string;
  internalId?: number;
  code?: string;
  name?: string;
  color?: string;
  lotStyle?: string;
  lotType?: string;
  archived?: boolean;
  bondId?: string;
  volume?: { value?: number; unit?: string };
  [key: string]: unknown;
}

export interface Varietal {
  id: string;
  name: string;
}

export interface Appellation {
  id: string;
  name: string;
}

// componentsSummary returns flat arrays — no nested juiceWineComposition wrapper
export interface ComponentsSummary {
  vintages?: VintageRow[];
  varietals?: VarietalRow[];
  appellations?: AppellationRow[];
  [key: string]: unknown;
}

export interface VintageRow {
  vintage?: number | string;
  year?: number | string;
  percentage?: number;   // decimal fraction 0–1 as returned by API
  percent?: number;      // fallback
  liters?: number;
  litres?: number;
  [key: string]: unknown;
}

export interface VarietalRow {
  varietalId?: string;
  id?: string;
  name?: string;
  percentage?: number;
  percent?: number;
  liters?: number;
  litres?: number;
  [key: string]: unknown;
}

export interface AppellationRow {
  appellationId?: string;
  id?: string;
  name?: string;
  percentage?: number;
  percent?: number;
  liters?: number;
  litres?: number;
  subAppellations?: AppellationRow[];
  [key: string]: unknown;
}

export interface Block {
  id?: string;
  name?: string;
  tags?: string[];
  internalId?: number;
  varietalId?: string;
  vineyardId?: string;
  area?: { value?: number; unit?: string };
  archived?: boolean;
  [key: string]: unknown;
}

export interface BlockComponent {
  block?: { id?: string; name?: string };
  varietal?: { id?: string; name?: string };
  vineyard?: { id?: string; name?: string };
  appellation?: { id?: string; name?: string };
  vintage?: number | string;
  percentage?: number;
  [key: string]: unknown;
}

export interface AdditiveProduct {
  id: string;
  productName?: string;
  inventoryUnit?: string;
  additionUnit?: string;
  archived?: boolean;
  [key: string]: unknown;
}

export interface Additive {
  id?: string;
  additiveId?: string;
  name?: string;
  additiveName?: string;
  batchNumber?: string;
  // amount is an object { value, unit } OR a flat number
  amount?: { value?: number; unit?: string } | number;
  unitOfMeasure?: string;
  uom?: string;
  // allergen indicated by indicatorIds being non-empty, or explicit boolean
  indicatorIds?: string[];
  isAllergen?: boolean;
  allergen?: boolean;
  [key: string]: unknown;
}

export interface AnalysisType {
  name?: string;
  abbreviation?: string;
  unit?: string;
  [key: string]: unknown;
}

export interface Analysis {
  id?: string;
  analysisType?: AnalysisType;
  value?: number | string;
  result?: number | string;    // fallback field name
  unit?: { name?: string; unit?: string };
  unitOfMeasure?: string;
  uom?: string;
  recordedAt?: string;
  date?: string;
  analysisDate?: string;
  createdAt?: string;
  deleted?: boolean;
  lotId?: string;
  [key: string]: unknown;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchLots(token: string): Promise<Lot[]> {
  return apiGetAll<Lot>(token, `/wineries/${WINERY_ID}/lots`);
}

export async function fetchLot(token: string, lotId: string): Promise<Lot> {
  return apiGet<Lot>(token, `/wineries/${WINERY_ID}/lots/${lotId}`);
}

export async function fetchVarietals(token: string): Promise<Varietal[]> {
  return apiGetAll<Varietal>(token, '/varietals');
}

export async function fetchAppellations(token: string): Promise<Appellation[]> {
  return apiGetAll<Appellation>(token, '/appellations');
}

export async function fetchComponentsSummary(
  token: string,
  lotId: string,
): Promise<ComponentsSummary> {
  return apiGet<ComponentsSummary>(
    token,
    `/wineries/${WINERY_ID}/lots/${lotId}/componentsSummary`,
  );
}

export async function fetchAdditives(
  token: string,
  lotId: string,
): Promise<Additive[]> {
  return apiGetAll<Additive>(
    token,
    `/wineries/${WINERY_ID}/lots/${lotId}/additives`,
  );
}

export async function fetchBlock(token: string, blockId: string): Promise<Block> {
  return apiGet<Block>(token, `/wineries/${WINERY_ID}/blocks/${blockId}`);
}

export async function fetchBlockComponents(
  token: string,
  lotId: string,
): Promise<BlockComponent[]> {
  return apiGetAll<BlockComponent>(
    token,
    `/wineries/${WINERY_ID}/lots/${lotId}/blockComponents`,
  );
}

export async function fetchAdditiveProducts(
  token: string,
): Promise<AdditiveProduct[]> {
  return apiGetAll<AdditiveProduct>(token, `/wineries/${WINERY_ID}/additives`);
}

export interface DryGoodIndicator {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export async function fetchDryGoodIndicators(
  token: string,
): Promise<DryGoodIndicator[]> {
  return apiGetAll<DryGoodIndicator>(token, '/dryGoodIndicators');
}

export interface Bond {
  id?: string;
  name?: string;
  code?: string;
  capacity?: number;
  [key: string]: unknown;
}

export async function fetchBond(token: string, bondId: string): Promise<Bond> {
  try {
    return await apiGet<Bond>(token, `/wineries/${WINERY_ID}/bonds/${bondId}`);
  } catch {
    return {};
  }
}

export async function fetchAnalyses(
  token: string,
  lotId: string,
): Promise<Analysis[]> {
  return apiGetAll<Analysis>(
    token,
    `/wineries/${WINERY_ID}/lots/${lotId}/analyses`,
  );
}

// ─── Lot Makeup (internal endpoint) ──────────────────────────────────────────

const INTERNAL_BASE_URL = 'https://sutter.staging.innovint.us';
const INTERNAL_WINERY_ID = '2160955';

export interface LotMakeupEntry {
  type: string;
  volume: { value: number; unit: string };
  weight: { value: number; unit: string };
  percentage: number;
}

export interface LotMakeup {
  juiceWine?: LotMakeupEntry;
  juiceConcentrate?: LotMakeupEntry;
  yeastCulture?: LotMakeupEntry;
  water?: LotMakeupEntry;
  additive?: LotMakeupEntry;
}

export async function fetchLotMakeup(token: string, lotCode: string): Promise<LotMakeup> {
  const path = `/wineries/${INTERNAL_WINERY_ID}/lots/${encodeURIComponent(lotCode)}/makeup?ngsw-bypass=true`;
  const url = `${INTERNAL_BASE_URL}${path}`;
  const res = await fetchWithRetry(url, { headers: buildHeaders(token) }, path);
  return res.json() as Promise<LotMakeup>;
}
