import { formatEth, getAddressParam, readHandler, setCache } from '../../../../lib/api'
import { isCollection } from '../../../../lib/indexer/collections'
import { resolveNames } from '../../../../lib/indexer/ens'
import { getWalletHistory } from '../../../../lib/queries'

function label(row, wallet) {
  switch (row.event) {
    case 'PhunkOffered': return 'Listed'
    case 'PhunkNoLongerForSale': return 'Delisted'
    case 'PhunkBidEntered': return 'Bid'
    case 'PhunkBidWithdrawn': return 'Bid Withdrawn'
    case 'PhunkBought': return row.from_address === wallet ? 'Sold' : 'Bought'
    default: return row.event
  }
}

// GET /api/wallets/:address/history[?collection=v3-phunks] -> marketplace activity, newest first.
// Shape matches what components/userHistory.js expects.
export default readHandler(async (req, res) => {
  const address = getAddressParam(req, res)
  if (!address) return

  const collection = req.query.collection || null
  if (collection && !isCollection(collection)) {
    return res.status(404).json({ error: `Unknown collection "${collection}"` })
  }

  const rows = await getWalletHistory(address, collection)
  const names = await resolveNames(rows.flatMap((r) => [r.from_address, r.to_address]))
  const display = (addr) => (addr ? names[addr] || addr : undefined)

  setCache(res)
  res.status(200).json(
    rows.map((r) => ({
      collection: r.collection,
      eventType: label(r, address),
      tokenId: r.token_id,
      imgRef: String(r.token_id).padStart(4, '0'),
      from: display(r.from_address),
      to: display(r.to_address),
      amount: formatEth(r.value_wei),
      hash: r.tx_hash,
      blockNumber: Number(r.block_number),
      timestamp: r.block_time,
    }))
  )
})
