import { formatEth, readHandler, setCache } from '../../../lib/api'
import { getListings, getSales, getVolume } from '../../../lib/queries'

const ZERO = '0x0000000000000000000000000000000000000000'
// Collections with a market page in the app, in display order
const SLUGS = ['philip-intern-project', 'wrapped-v1-phunks', 'v3-phunks']
// Enough preview tokens to fill one row on wide screens
const PREVIEW_LIMIT = 40

async function summarize(collection) {
  const [listings, [lastSale], volume] = await Promise.all([
    getListings(collection),
    getSales(collection, 1),
    getVolume(collection),
  ])

  // Public listings only: private ones (reserved for one buyer) can't be bought by anyone else.
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
    preview: open.slice(0, PREVIEW_LIMIT).map((l) => l.token_id),
  }
}

// GET /api/collections/summary -> listed count, floor, last sale, all-time volume and a preview
// of the cheapest public listings for each collection with a market page.
export default readHandler(async (req, res) => {
  const summaries = await Promise.all(SLUGS.map(summarize))
  setCache(res, 15)
  res.status(200).json(summaries)
})
