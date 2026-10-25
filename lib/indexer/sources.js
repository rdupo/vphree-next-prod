import { ALL_ADDRESSES, ALL_TOPICS } from './collections'
import { toInt } from './decode'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- Alchemy (JSON-RPC) ----------

// Free tier caps eth_getLogs at 10 blocks per request. Raise this if you upgrade plans.
const ALCHEMY_MAX_RANGE = Number(process.env.ALCHEMY_MAX_BLOCK_RANGE || 10)

function alchemyUrl() {
  const key = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_API_KEY
  if (!key) throw new Error('ALCHEMY_API_KEY is not set')
  return `https://eth-mainnet.g.alchemy.com/v2/${key}`
}

export function getRpcUrl() {
  return alchemyUrl()
}

async function rpc(method, params, attempt = 1) {
  const res = await fetch(alchemyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 429 || json.error?.code === 429) {
    if (attempt >= 5) throw new Error(`Alchemy rate limited on ${method}`)
    await sleep(500 * attempt)
    return rpc(method, params, attempt + 1)
  }
  if (json.error) throw new Error(`Alchemy ${method}: ${json.error.message}`)
  return json.result
}

export async function getHeadBlock() {
  return toInt(await rpc('eth_blockNumber', []))
}

function normalizeRpcLog(log) {
  return {
    address: log.address,
    topics: log.topics,
    data: log.data,
    blockNumber: toInt(log.blockNumber),
    logIndex: toInt(log.logIndex),
    transactionHash: log.transactionHash,
    blockTime: log.blockTimestamp ? new Date(toInt(log.blockTimestamp) * 1000) : null,
    removed: Boolean(log.removed),
  }
}

/** All relevant logs for every indexed contract in [fromBlock, toBlock], in free-tier sized chunks. */
export async function getLogsFromAlchemy(fromBlock, toBlock) {
  const logs = []
  for (let start = fromBlock; start <= toBlock; start += ALCHEMY_MAX_RANGE) {
    const end = Math.min(start + ALCHEMY_MAX_RANGE - 1, toBlock)
    const result = await rpc('eth_getLogs', [
      {
        fromBlock: '0x' + start.toString(16),
        toBlock: '0x' + end.toString(16),
        address: ALL_ADDRESSES,
        topics: [ALL_TOPICS],
      },
    ])
    logs.push(...result.map(normalizeRpcLog).filter((l) => !l.removed))
  }
  return logs
}

export function alchemyBlocksPerCall() {
  return ALCHEMY_MAX_RANGE
}

// ---------- Etherscan (v2 API) ----------
// No block-range limit, 1,000 logs per page. Free tier: ~3 calls/sec.

const ETHERSCAN_URL = 'https://api.etherscan.io/v2/api'
const ETHERSCAN_PAGE_SIZE = 1000
const ETHERSCAN_MIN_INTERVAL_MS = 400
let lastEtherscanCall = 0

export function hasEtherscan() {
  return Boolean(process.env.ETHERSCAN_API_KEY)
}

async function etherscanGetLogs({ address, fromBlock, toBlock, topic0 }, attempt = 1) {
  const wait = lastEtherscanCall + ETHERSCAN_MIN_INTERVAL_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastEtherscanCall = Date.now()

  const params = new URLSearchParams({
    chainid: '1',
    module: 'logs',
    action: 'getLogs',
    address,
    fromBlock: String(fromBlock),
    toBlock: String(toBlock),
    page: '1',
    offset: String(ETHERSCAN_PAGE_SIZE),
    apikey: process.env.ETHERSCAN_API_KEY,
  })
  if (topic0) params.set('topic0', topic0)

  const res = await fetch(`${ETHERSCAN_URL}?${params}`)
  const json = await res.json().catch(() => ({}))

  if (json.status === '1') return json.result
  if (json.message === 'No records found') return []

  const reason = typeof json.result === 'string' ? json.result : json.message
  if (attempt < 5 && /rate limit|timeout|busy/i.test(reason || '')) {
    await sleep(1000 * attempt)
    return etherscanGetLogs({ address, fromBlock, toBlock, topic0 }, attempt + 1)
  }
  throw new Error(`Etherscan getLogs failed for ${address}: ${reason || res.status}`)
}

function normalizeEtherscanLog(log) {
  return {
    address: log.address,
    topics: log.topics.filter(Boolean),
    data: log.data,
    blockNumber: toInt(log.blockNumber),
    logIndex: toInt(log.logIndex),
    transactionHash: log.transactionHash,
    blockTime: log.timeStamp ? new Date(toInt(log.timeStamp) * 1000) : null,
  }
}

/**
 * Yields batches of logs for one contract over [fromBlock, toBlock]. Pages by moving fromBlock
 * forward to the last block returned; overlapping logs are de-duplicated by the upsert.
 */
export async function* getLogsFromEtherscan(contract, fromBlock, toBlock) {
  // NFT contracts emit lots of Approval events, so filter to Transfer server-side.
  // Market contracts only emit events we mostly want, so fetch everything and filter on decode.
  const topic0 = contract.kind === 'nft' ? contract.topics[0] : undefined
  let cursor = fromBlock

  while (cursor <= toBlock) {
    const raw = await etherscanGetLogs({ address: contract.address, fromBlock: cursor, toBlock, topic0 })
    const logs = raw.map(normalizeEtherscanLog)
    yield logs

    if (logs.length < ETHERSCAN_PAGE_SIZE) return
    const lastBlock = logs[logs.length - 1].blockNumber
    if (lastBlock <= cursor) {
      throw new Error(`More than ${ETHERSCAN_PAGE_SIZE} logs in block ${cursor} for ${contract.address}`)
    }
    cursor = lastBlock
  }
}
