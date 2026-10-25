import { ethers } from 'ethers'
import { COLLECTIONS } from './indexer/collections'
import { getRpcUrl } from './indexer/sources'
import { getCandidateOffers } from './queries'

// Safety cap on contract reads per request.
const MAX_CANDIDATES = 50

let provider
function getProvider() {
  if (!provider) provider = new ethers.JsonRpcProvider(getRpcUrl(), 1, { staticNetwork: true })
  return provider
}

const markets = {}
function getMarket(collection) {
  if (!markets[collection]) {
    const { address, abi } = COLLECTIONS[collection].market
    markets[collection] = new ethers.Contract(address, abi, getProvider())
  }
  return markets[collection]
}

/**
 * Bids a wallet currently has open across all marketplaces. Event history narrows the list,
 * then each bid is confirmed against the market's phunkBids() so the result matches the chain.
 */
export async function getActiveOffers(address) {
  const candidates = (await getCandidateOffers(address)).slice(0, MAX_CANDIDATES)

  const checked = await Promise.all(
    candidates.map(async (c) => {
      try {
        const bid = await getMarket(c.collection).phunkBids(c.token_id)
        const open = bid.hasBid && bid.bidder.toLowerCase() === address
        return open ? { ...c, value_wei: bid.value.toString() } : null
      } catch {
        return c // RPC hiccup: fall back to what the events say
      }
    })
  )
  return checked.filter(Boolean)
}
