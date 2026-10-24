import { useMemo } from 'react';
import useApi from './useApi';
import phunkAttMap from '../utils/phunkAttMap';

const attributesById = {};
phunkAttMap.forEach((item) => { attributesById[item.tokenId] = item.attributes; });

// Active marketplace listings for a collection, cheapest first, with phunk attributes attached
// for the trait filters. Each item: { tokenId, minValue (ETH string), seller, onlySellTo, attributes }
const useListings = (collection) => {
  const { data, loading, error } = useApi(`/api/collections/${collection}/listings`);

  const listings = useMemo(() => (data || []).map((listing) => ({
    ...listing,
    attributes: attributesById[listing.tokenId] || [],
  })), [data]);

  return { listings, loading, error };
};

export default useListings;
