import useApi from './useApi';

// Transaction history for one token, shaped for components/History_qBC.js.
const useTokenHistory = (collection, id) => {
  const url = id !== undefined && id !== null && id !== '' ? `/api/collections/${collection}/tokens/${id}/history` : null;
  const { data, loading, error } = useApi(url);

  return { transactionHistory: data || [], loading, error };
};

export default useTokenHistory;
