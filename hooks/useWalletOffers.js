import useApi from './useApi';

// Open bids a wallet has placed across all four marketplaces.
// Each item: { collection, tokenId, value (ETH string), txHash, blockNumber, timestamp }
const useWalletOffers = (wallet) => {
  const url = wallet && wallet.length > 1 ? `/api/wallets/${wallet}/offers` : null;
  const { data, loading, error } = useApi(url);

  return { offers: data || [], loading, error };
};

export default useWalletOffers;
