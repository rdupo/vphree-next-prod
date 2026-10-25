import { useMemo } from 'react';
import useApi from './useApi';

// Recent sales for a collection, shaped for <SaleCard>. collection: 'v3-phunks' | 'cryptophunks' | ...
const useSales = (collection, limit = 20) => {
  const { data, loading, error } = useApi(`/api/collections/${collection}/sales?limit=${limit}`);

  const sales = useMemo(() => (data || []).map((sale) => ({
    price: Number(sale.price).toFixed(3),
    atts: '',
    id: sale.tokenId,
    hash: sale.txHash,
  })), [data]);

  return { sales, loading, error };
};

export default useSales;
