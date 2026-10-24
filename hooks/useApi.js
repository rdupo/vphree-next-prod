import { useEffect, useState } from 'react';

// Fetch JSON from one of our /api routes. Pass a falsy url to skip (e.g. while router isn't ready).
const useApi = (url) => {
  const [state, setState] = useState({ data: null, loading: Boolean(url), error: null });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: err.message }); });

    return () => { cancelled = true; };
  }, [url]);

  return state;
};

export default useApi;
