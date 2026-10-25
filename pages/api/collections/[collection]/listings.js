import { formatEth, getCollectionParam, readHandler, setCache } from '../../../../lib/api'
import { getListings } from '../../../../lib/queries'

const ZERO = '0x0000000000000000000000000000000000000000'

// GET /api/collections/:collection/listings -> active listings, cheapest first
export default readHandler(async (req, res) => {
  const collection = getCollectionParam(req, res)
  if (!collection) return

  const rows = await getListings(collection)
  setCache(res)
  res.status(200).json(
    rows.map((r) => ({
      tokenId: r.token_id,
      minValue: formatEth(r.value_wei),
      seller: r.from_address || undefined,
      onlySellTo: r.to_address && r.to_address !== ZERO ? r.to_address : undefined,
      blockNumber: Number(r.block_number),
      txHash: r.tx_hash,
    }))
  )
})
