import { getAddressParam, readHandler, setCache } from '../../../../lib/api'
import { isCollection } from '../../../../lib/indexer/collections'
import { getOwnedTokenIds } from '../../../../lib/queries'

// GET /api/wallets/:address/nfts?collection=v3-phunks -> [tokenId, ...] currently held
export default readHandler(async (req, res) => {
  const address = getAddressParam(req, res)
  if (!address) return

  const { collection } = req.query
  if (!isCollection(collection)) {
    return res.status(400).json({ error: 'collection query param is required' })
  }

  setCache(res)
  res.status(200).json(await getOwnedTokenIds(address, collection))
})
