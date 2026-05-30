import { useState, useCallback, useRef } from 'react';
import { ApiError } from '@/api/client';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Wraps an async API call in loading/error/data state.
 * The returned `execute` function is stable (safe to use in deps arrays).
 * Always calls the latest version of `fn` via a ref, so you can pass
 * inline functions without triggering re-renders.
 */
export function useAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Keep a ref to the latest fn so execute doesn't need it as a dep
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await fnRef.current(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError(
              0,
              err instanceof Error ? err.message : 'Something went wrong',
            );
      setState({ data: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  const reset = useCallback(
    () => setState({ data: null, loading: false, error: null }),
    [],
  );

  return { ...state, execute, reset };
}
