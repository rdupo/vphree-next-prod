import { CONTRACT_BY_ADDRESS } from './collections'

// Etherscan returns "0x" for zero; Alchemy returns proper hex. Accept numbers too.
export function toInt(value) {
  if (typeof value === 'number') return value
  if (value === undefined || value === null || value === '0x' || value === '') return 0
  return parseInt(value, 16)
}

const lower = (v) => (v ? v.toLowerCase() : null)

/**
 * Turn a raw log (already normalized to { address, topics, data, blockNumber, logIndex,
 * transactionHash, blockTime }) into an `events` row. Returns null for logs we don't keep.
 */
export function decodeLog(log) {
  const contract = CONTRACT_BY_ADDRESS[log.address.toLowerCase()]
  if (!contract) return null

  let parsed
  try {
    parsed = contract.iface.parseLog({ topics: log.topics, data: log.data })
  } catch {
    return null
  }
  if (!contract.events.includes(parsed.name)) return null

  const a = parsed.args
  const tokenId = a.tokenId ?? a.phunkIndex
  const value = a.value ?? a.minValue

  return {
    tx_hash: log.transactionHash.toLowerCase(),
    log_index: log.logIndex,
    block_number: log.blockNumber,
    block_time: log.blockTime ?? null,
    collection: contract.collection,
    contract: contract.address,
    event: parsed.name,
    token_id: tokenId.toNumber(),
    from_address: lower(a.from ?? a.fromAddress),
    to_address: lower(a.to ?? a.toAddress),
    value_wei: value ? value.toString() : null,
  }
}

export function decodeLogs(logs) {
  return logs.map(decodeLog).filter(Boolean)
}
