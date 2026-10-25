import { formatEth, getCollectionParam, readHandler, setCache } from '../../../../lib/api'
import { getSales } from '../../../../lib/queries'

// GET /api/collections/:collection/sales?limit=20 -> most recent sales, newest first
export default readHandler(async (req, res) => {
  const collection = getCollectionParam(req, res)
  if (!collection) return

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200)
  const rows = await getSales(collection, limit)
  setCache(res)
  res.status(200).json(
    rows.map((r) => ({
      tokenId: r.token_id,
      price: formatEth(r.value_wei),
      seller: r.from_address,
      buyer: r.to_address,
      txHash: r.tx_hash,
      blockNumber: Number(r.block_number),
      timestamp: r.block_time,
    }))
  )
})
