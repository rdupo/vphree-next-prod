import useApi from './useApi';

// Marketplace activity for a wallet, shaped for components/userHistory.js.
// Returns [{ eventType: 'none' }] when the wallet has no activity (what that component expects).
const useWalletHistory = (wallet, collection) => {
  const query = collection ? `?collection=${collection}` : '';
  const url = wallet && wallet.length > 1 ? `/api/wallets/${wallet}/history${query}` : null;
  const { data, loading, error } = useApi(url);

  let transactionHistory = [];
  if (data) transactionHistory = data.length > 0 ? data : [{ eventType: 'none' }];

  return { transactionHistory, loading, error };
};

export default useWalletHistory;
