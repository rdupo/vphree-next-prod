import { CONTRACTS } from './collections'
import { decodeLogs } from './decode'
import {
  alchemyBlocksPerCall,
  getHeadBlock,
  getLogsFromAlchemy,
  getLogsFromEtherscan,
  hasEtherscan,
} from './sources'
import { acquireLease, releaseLease, replaceRange, setLastBlock, upsertEvents } from './store'

// Blocks behind head before we treat data as final. Newer blocks are re-fetched every sync.
const CONFIRMATIONS = 12
// With Alchemy free tier (10 blocks/call), cap how many calls one sync can make.
const MAX_ALCHEMY_CALLS_PER_SYNC = Number(process.env.MAX_ALCHEMY_CALLS_PER_SYNC || 30)

async function fetchRange(fromBlock, toBlock) {
  const span = toBlock - fromBlock + 1
  const alchemyCalls = Math.ceil(span / alchemyBlocksPerCall())

  // Small gaps (the normal case) are one or two Alchemy calls covering every contract.
  // Big gaps are cheaper through Etherscan: one call per contract regardless of range.
  if (alchemyCalls <= MAX_ALCHEMY_CALLS_PER_SYNC || !hasEtherscan()) {
    return { logs: await getLogsFromAlchemy(fromBlock, toBlock), source: 'alchemy' }
  }

  const logs = []
  for (const contract of CONTRACTS) {
    for await (const batch of getLogsFromEtherscan(contract, fromBlock, toBlock)) logs.push(...batch)
  }
  return { logs, source: 'etherscan' }
}

/**
 * Bring the database up to the chain head. Safe to call often: it no-ops if another sync is
 * running or the last one finished less than `staleSeconds` ago.
 */
export async function syncIncremental({ staleSeconds = 0 } = {}) {
  const lastBlock = await acquireLease({ staleSeconds })
  if (lastBlock === null) return { skipped: true }

  let newLastBlock
  try {
    const head = await getHeadBlock()
    const fromBlock = lastBlock + 1
    if (fromBlock > head) {
      newLastBlock = lastBlock
      return { skipped: false, fromBlock, toBlock: head, events: 0 }
    }

    // Without Etherscan, a very large gap is worked through over several syncs.
    let toBlock = head
    if (!hasEtherscan()) {
      toBlock = Math.min(head, fromBlock + MAX_ALCHEMY_CALLS_PER_SYNC * alchemyBlocksPerCall() - 1)
    }

    const { logs, source } = await fetchRange(fromBlock, toBlock)
    const rows = decodeLogs(logs)
    await replaceRange(fromBlock, toBlock, rows)

    newLastBlock = Math.max(lastBlock, Math.min(toBlock, head - CONFIRMATIONS))
    return { skipped: false, source, fromBlock, toBlock, head, events: rows.length }
  } finally {
    await releaseLease(newLastBlock)
  }
}

/**
 * One-time (re-runnable) historical load through Etherscan. Upserts, so it is safe to re-run
 * or resume with a later `fromBlock`.
 */
export async function backfill({ fromBlock = 0, log = console.log } = {}) {
  if (!hasEtherscan()) {
    throw new Error('Backfill needs ETHERSCAN_API_KEY (free at https://etherscan.io/apis).')
  }

  const head = await getHeadBlock()
  log(`Backfilling blocks ${fromBlock} -> ${head}`)

  let total = 0
  for (const contract of CONTRACTS) {
    let count = 0
    for await (const batch of getLogsFromEtherscan(contract, fromBlock, head)) {
      const rows = decodeLogs(batch)
      await upsertEvents(rows)
      count += rows.length
      const lastBlock = batch.length ? batch[batch.length - 1].blockNumber : head
      log(`  ${contract.collection} ${contract.kind}: ${count} events (through block ${lastBlock})`)
    }
    total += count
  }

  await setLastBlock(head - CONFIRMATIONS)
  log(`Done: ${total} events. Sync cursor set to block ${head - CONFIRMATIONS}.`)
  return { total, head }
}
