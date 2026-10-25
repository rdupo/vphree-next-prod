import { formatEth, getCollectionParam, readHandler, setCache } from '../../../../../../lib/api'
import { resolveNames } from '../../../../../../lib/indexer/ens'
import { getTokenHistory } from '../../../../../../lib/queries'

const ZERO = '0x0000000000000000000000000000000000000000'

const EVENT_LABELS = {
  Transfer: 'Transfer',
  PhunkOffered: 'Listed',
  PhunkBidEntered: 'Bid',
  PhunkBought: 'Sold',
}

// GET /api/collections/:collection/tokens/:id/history -> events for one token, newest first.
// Shape matches what components/History_qBC.js expects.
export default readHandler(async (req, res) => {
  const collection = getCollectionParam(req, res)
  if (!collection) return

  const tokenId = Number(req.query.id)
  if (!Number.isInteger(tokenId) || tokenId < 0) {
    return res.status(400).json({ error: 'Invalid token id' })
  }

  const rows = await getTokenHistory(collection, tokenId)
  const names = await resolveNames(rows.flatMap((r) => [r.from_address, r.to_address]))
  const display = (addr) => (addr ? names[addr] || addr : undefined)

  setCache(res)
  res.status(200).json(
    rows.map((r) => ({
      eventType: r.event === 'Transfer' && r.from_address === ZERO ? 'Mint' : EVENT_LABELS[r.event],
      from: display(r.from_address),
      to: display(r.to_address),
      amount: r.value_wei === null ? '' : formatEth(r.value_wei),
      hash: r.tx_hash,
      blockNumber: Number(r.block_number),
      timestamp: r.block_time,
    }))
  )
})
