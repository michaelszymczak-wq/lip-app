// InnoVint API Client — server-side port of src/api/innovint.ts
// Types are duplicated intentionally to avoid workspace complexity.

const WINERY_ID = 'wnry_0ZLW59P4EM5ZENE7X6RV8KJD';
const BASE_URL = 'https://sutter.staging.innovint.us/api/v1';
const DEFAULT_PAGE_SIZE = 200;

class InnoVintError extends Error {
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

function buildHeaders(token: string): Record<string, string> {
  const authValue =
    token.startsWith('Access-Token ') || token.startsWith('Bearer ')
      ? token
      : `Access-Token ${token}`;
  return { Authorization: authValue };
}

function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as Record<string, unknown>).data as T;
  }
  return raw as T;
}

async function apiGet<T>(token: string, path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetchWithRetry(url, { headers: buildHeaders(token) }, path);
  const json = await res.json();
  return unwrap<T>(json);
}

async function apiGetAll<T>(
  token: string,
  path: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const allItems: T[] = [];
  let offset = 0;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${path}${separator}limit=${pageSize}&offset=${offset}`;
    const res = await fetchWithRetry(url, { headers: buildHeaders(token) }, path);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const envelope = await res.json() as any;

    if (Array.isArray(envelope)) {
      allItems.push(...envelope.map((x: unknown) => unwrap<T>(x)));
      break;
    }

    // { pagination: { count, next }, results: [...] }  — lots
    if (envelope.results !== undefined) {
      const raw = (envelope.results ?? []) as unknown[];
      const items = raw.map((x: unknown) => unwrap<T>(x));
      allItems.push(...items);
      const total: number = envelope.pagination?.count ?? 0;
      const fetched = offset + items.length;
      if (!envelope.pagination?.next || fetched >= total || items.length < pageSize) break;
      offset += pageSize;
      continue;
    }

    // { data: [...], meta: { total } }  — additives, analyses, varietals, appellations
    const raw = (envelope.data ?? []) as unknown[];
    const items = raw.map((x: unknown) => unwrap<T>(x));
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

export interface ComponentsSummary {
  vintages?: VintageRow[];
  varietals?: VarietalRow[];
  appellations?: AppellationRow[];
  [key: string]: unknown;
}

export interface VintageRow {
  vintage?: number | string;
  year?: number | string;
  percentage?: number;
  percent?: number;
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
  tags?: string[];
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
  amount?: { value?: number; unit?: string } | number;
  unitOfMeasure?: string;
  uom?: string;
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
  result?: number | string;
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

// ─── Individual fetchers ──────────────────────────────────────────────────────

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

export async function fetchAdditives(token: string, lotId: string): Promise<Additive[]> {
  return apiGetAll<Additive>(token, `/wineries/${WINERY_ID}/lots/${lotId}/additives`);
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

export async function fetchAdditiveProducts(token: string): Promise<AdditiveProduct[]> {
  return apiGetAll<AdditiveProduct>(token, `/wineries/${WINERY_ID}/additives`);
}

export interface DryGoodIndicator {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export async function fetchDryGoodIndicators(token: string): Promise<DryGoodIndicator[]> {
  return apiGetAll<DryGoodIndicator>(token, '/dryGoodIndicators');
}

export interface CurrentUser {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export async function fetchCurrentUser(token: string): Promise<CurrentUser> {
  try {
    return await apiGet<CurrentUser>(token, '/me');
  } catch {
    return {};
  }
}

export interface Bond {
  id?: string;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

export async function fetchBond(token: string, bondId: string): Promise<Bond> {
  try {
    return await apiGet<Bond>(token, `/wineries/${WINERY_ID}/bonds/${bondId}`);
  } catch {
    return {};
  }
}

export async function fetchAnalyses(token: string, lotId: string): Promise<Analysis[]> {
  return apiGetAll<Analysis>(token, `/wineries/${WINERY_ID}/lots/${lotId}/analyses`);
}

// ─── Aggregate fetch ──────────────────────────────────────────────────────────

export interface AllLotData {
  lot: Lot;
  bond: Bond;
  componentsSummary: ComponentsSummary;
  blockComponents: BlockComponent[];
  additives: Additive[];
  analyses: Analysis[];
  varietals: Varietal[];
  appellations: Appellation[];
  additiveProducts: AdditiveProduct[];
  dryGoodIndicators: DryGoodIndicator[];
  currentUser: CurrentUser;
}

export async function fetchAllLotData(token: string, lotId: string): Promise<AllLotData> {
  const [
    lot,
    componentsSummary,
    blockComponentsRaw,
    additives,
    analyses,
    varietals,
    appellations,
    additiveProducts,
    dryGoodIndicators,
    currentUser,
  ] = await Promise.all([
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
    ...new Set(
      blockComponentsRaw
        .map((r) => r.block?.id)
        .filter((id): id is string => !!id),
    ),
  ];
  const [blockTagResults, bond] = await Promise.all([
    Promise.all(
      uniqueBlockIds.map((id) =>
        fetchBlock(token, id)
          .then((b) => ({ id, tags: b.tags ?? [] }))
          .catch(() => ({ id, tags: [] as string[] })),
      ),
    ),
    lot.bondId ? fetchBond(token, lot.bondId) : Promise.resolve({}),
  ]);
  const blockTagMap: Record<string, string[]> = {};
  blockTagResults.forEach(({ id, tags }) => {
    blockTagMap[id] = tags;
  });

  // Enrich block components with tags
  const blockComponents = blockComponentsRaw.map((bc) => ({
    ...bc,
    tags: blockTagMap[bc.block?.id ?? ''] ?? [],
  }));

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
