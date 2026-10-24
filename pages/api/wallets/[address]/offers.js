import { formatEth, getAddressParam, readHandler, setCache } from '../../../../lib/api'
import { getActiveOffers } from '../../../../lib/offers'

// GET /api/wallets/:address/offers -> open bids this wallet has placed, newest first
export default readHandler(async (req, res) => {
  const address = getAddressParam(req, res)
  if (!address) return

  const offers = await getActiveOffers(address)
  setCache(res)
  res.status(200).json(
    offers.map((o) => ({
      collection: o.collection,
      tokenId: o.token_id,
      value: formatEth(o.value_wei),
      txHash: o.tx_hash,
      blockNumber: Number(o.block_number),
      timestamp: o.block_time,
    }))
  )
})
