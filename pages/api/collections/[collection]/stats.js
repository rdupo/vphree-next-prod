import { getCollectionParam, readHandler, setCache } from '../../../../lib/api'
import { summarizeCollection } from '../../../../lib/collectionSummary'

// GET /api/collections/:collection/stats -> listed count, floor, last sale, all-time volume
export default readHandler(async (req, res) => {
  const collection = getCollectionParam(req, res)
  if (!collection) return

  setCache(res, 15)
  res.status(200).json(await summarizeCollection(collection))
})
