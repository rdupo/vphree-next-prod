import { ethers } from 'ethers'
import philipAddy from '../../utils/philipAddy'
import philipAbi from '../../utils/philipAbi'
import philipMarketAddy from '../../utils/philipMarketAddy'
import philipMarketAbi from '../../utils/philipMarketAbi'
import phunkAddy from '../../utils/phunkAddy'
import phunkAbi from '../../utils/phunkAbi'
import nllAddy from '../../utils/nllAddy'
import nllAbi from '../../utils/nllAbi'
import wrapperAddy from '../../utils/wrapperAddy'
import wrapperAbi from '../../utils/wrapperAbi'
import wv1pAddy from '../../utils/wv1pAddy'
import wv1pAbi from '../../utils/wv1pAbi'
import v3PhunkAddy from '../../utils/v3PhunkAddy'
import v3PhunkAbi from '../../utils/v3PhunkAbi'
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'

// Slugs match the /collections/* and /view-all/* page routes.
export const COLLECTIONS = {
  'philip-intern-project': {
    nft: { address: philipAddy, abi: philipAbi },
    market: { address: philipMarketAddy, abi: philipMarketAbi },
  },
  'cryptophunks': {
    nft: { address: phunkAddy, abi: phunkAbi },
    market: { address: nllAddy, abi: nllAbi },
  },
  'wrapped-v1-phunks': {
    nft: { address: wrapperAddy, abi: wrapperAbi },
    market: { address: wv1pAddy, abi: wv1pAbi },
  },
  'v3-phunks': {
    nft: { address: v3PhunkAddy, abi: v3PhunkAbi },
    market: { address: v3MarketAddy, abi: v3MarketAbi },
  },
}

export const NFT_EVENTS = ['Transfer']
export const MARKET_EVENTS = [
  'PhunkOffered',
  'PhunkNoLongerForSale',
  'PhunkBidEntered',
  'PhunkBidWithdrawn',
  'PhunkBought',
]

// Flat list of every contract we index, with its decoder and the topic0s we keep.
export const CONTRACTS = Object.entries(COLLECTIONS).flatMap(([collection, c]) =>
  [
    { kind: 'nft', ...c.nft, events: NFT_EVENTS },
    { kind: 'market', ...c.market, events: MARKET_EVENTS },
  ].map(({ kind, address, abi, events }) => {
    const iface = new ethers.utils.Interface(abi)
    return {
      collection,
      kind,
      address: address.toLowerCase(),
      iface,
      events,
      topics: events.map((name) => iface.getEventTopic(name)),
    }
  })
)

export const CONTRACT_BY_ADDRESS = Object.fromEntries(CONTRACTS.map((c) => [c.address, c]))
export const ALL_ADDRESSES = CONTRACTS.map((c) => c.address)
export const ALL_TOPICS = [...new Set(CONTRACTS.flatMap((c) => c.topics))]

export function isCollection(slug) {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, slug)
}
