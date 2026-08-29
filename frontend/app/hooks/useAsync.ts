import { useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  /** Resolved data, or undefined while loading / on error. */
  data: T | undefined;
  loading: boolean;
}

/**
 * Run an async loader whenever `deps` change. `loading` stays true until the
 * load settles. Errors are swallowed: `data` stays undefined so the caller can
 * render an empty/graceful state instead of crashing. A re-run or unmount
 * invalidates any in-flight result from the previous run.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const seqRef = useRef(0);

  useEffect(() => {
    const seq = ++seqRef.current;
    setLoading(true);
    setData(undefined);
    loader()
      .then((d) => {
        if (seqRef.current === seq) setData(d);
      })
      .catch(() => {
        /* network/data error — treat as empty so the UI degrades gracefully */
      })
      .finally(() => {
        if (seqRef.current === seq) setLoading(false);
      });
    return () => {
      seqRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}