import { useCallback, useEffect, useState } from 'react';

// Runs an async API function and keeps { data, loading, error }.
// Call reload() after a change (approve, order, ...) to fetch fresh data.
// Previous data stays on screen while reloading, so the page does not flash.
export default function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => active && setState({ data, loading: false, error: '' }))
      .catch((e) => active && setState({ data: null, loading: false, error: e.message }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
