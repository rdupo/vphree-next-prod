import { formatEth } from './api'
import { getListings, getSales, getVolume } from './queries'

const ZERO = '0x0000000000000000000000000000000000000000'

// Collections with a market page in the app, in display order
export const MARKET_COLLECTIONS = ['philip-intern-project', 'wrapped-v1-phunks', 'v3-phunks']

/**
 * Listed count, floor, last sale and all-time volume for a collection, plus up to `previewLimit`
 * of its cheapest public listings. Private listings (reserved for one buyer) are left out.
 */
export async function summarizeCollection(collection, { previewLimit = 0 } = {}) {
  const [listings, [lastSale], volume] = await Promise.all([
    getListings(collection),
    getSales(collection, 1),
    getVolume(collection),
  ])

  // getListings already returns cheapest first.
  const open = listings.filter((l) => !l.to_address || l.to_address === ZERO)

  return {
    collection,
    listedCount: open.length,
    floor: open.length ? formatEth(open[0].value_wei) : null,
    lastSale: lastSale
      ? { tokenId: lastSale.token_id, price: formatEth(lastSale.value_wei), timestamp: lastSale.block_time }
      : null,
    volume: formatEth(volume.volume_wei),
    salesCount: volume.sales,
    preview: open.slice(0, previewLimit).map((l) => l.token_id),
  }
}
