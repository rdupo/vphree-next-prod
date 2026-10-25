import { readHandler, setCache } from '../../../lib/api'
import { MARKET_COLLECTIONS, summarizeCollection } from '../../../lib/collectionSummary'

// Enough preview tokens to fill one row on wide screens
const PREVIEW_LIMIT = 40

// GET /api/collections/summary -> listed count, floor, last sale, all-time volume and a preview
// of the cheapest public listings for each collection with a market page.
export default readHandler(async (req, res) => {
  const summaries = await Promise.all(
    MARKET_COLLECTIONS.map((c) => summarizeCollection(c, { previewLimit: PREVIEW_LIMIT }))
  )
  setCache(res, 15)
  res.status(200).json(summaries)
})
