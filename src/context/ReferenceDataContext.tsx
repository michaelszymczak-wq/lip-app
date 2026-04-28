import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { fetchVarietals, fetchAppellations, fetchAdditiveProducts, fetchDryGoodIndicators } from '../api/innovint';
import { useAuth } from './AuthContext';

type LookupMap = Record<string, string>;

interface ReferenceDataContextValue {
  varietals: LookupMap;
  appellations: LookupMap;
  additiveProducts: LookupMap;      // id → productName
  dryGoodIndicators: LookupMap;     // id → indicator name
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const ReferenceDataContext = createContext<
  ReferenceDataContextValue | undefined
>(undefined);

export function ReferenceDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const [varietals, setVarietals] = useState<LookupMap>({});
  const [appellations, setAppellations] = useState<LookupMap>({});
  const [additiveProducts, setAdditiveProducts] = useState<LookupMap>({});
  const [dryGoodIndicators, setDryGoodIndicators] = useState<LookupMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchVarietals(token),
      fetchAppellations(token),
      fetchAdditiveProducts(token),
      fetchDryGoodIndicators(token),
    ])
      .then(([vList, aList, dList, indList]) => {
        if (cancelled) return;

        const vMap: LookupMap = {};
        vList.forEach((v) => { vMap[v.id] = v.name; });

        const aMap: LookupMap = {};
        aList.forEach((a) => { aMap[a.id] = a.name; });

        const dMap: LookupMap = {};
        dList.forEach((d) => {
          if (d.id && d.productName) dMap[d.id] = d.productName;
        });

        const indMap: LookupMap = {};
        indList.forEach((ind) => {
          if (ind.id && ind.name) indMap[ind.id] = ind.name;
        });

        setVarietals(vMap);
        setAppellations(aMap);
        setAdditiveProducts(dMap);
        setDryGoodIndicators(indMap);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Failed to load reference data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, revision]);

  return (
    <ReferenceDataContext.Provider
      value={{ varietals, appellations, additiveProducts, dryGoodIndicators, loading, error, reload }}
    >
      {children}
    </ReferenceDataContext.Provider>
  );
}

export function useReferenceData(): ReferenceDataContextValue {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx)
    throw new Error('useReferenceData must be used within ReferenceDataProvider');
  return ctx;
}
