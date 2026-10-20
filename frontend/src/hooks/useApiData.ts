"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Load real data from an API call with loading / error / reload — no fallback records.
 * `deps` re-run the loader (e.g. filters). Errors are surfaced, never replaced by demo data.
 */
export function useApiData<T>(loader: () => Promise<T>, deps: ReadonlyArray<unknown> = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loader()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [version, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  return { data, error, loading, reload, setData };
}
