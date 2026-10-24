import { useEffect, useState } from 'react';

// Fetch JSON from one of our /api routes. Pass a falsy url to skip (e.g. while router isn't ready).
const useApi = (url) => {
  // Remember which url the stored result belongs to, so loading can be derived instead of set.
  const [result, setResult] = useState({ url: null, data: null, error: null });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((data) => { if (!cancelled) setResult({ url, data, error: null }); })
      .catch((err) => { if (!cancelled) setResult({ url, data: null, error: err.message }); });

    return () => { cancelled = true; };
  }, [url]);

  const isCurrent = result.url === url;
  return {
    data: isCurrent ? result.data : null,
    loading: Boolean(url) && !isCurrent,
    error: isCurrent ? result.error : null,
  };
};

export default useApi;
