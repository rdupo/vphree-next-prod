import { ethers } from 'ethers'
import { getSql } from '../db'
import { getRpcUrl } from './sources'

const CACHE_DAYS = 7
// Cap fresh lookups per request so one page with lots of new addresses stays fast.
const MAX_LOOKUPS_PER_REQUEST = 25
const ZERO = '0x0000000000000000000000000000000000000000'

let provider
function getProvider() {
  if (!provider) provider = new ethers.providers.StaticJsonRpcProvider(getRpcUrl(), 1)
  return provider
}

/** Map of lowercase address -> ENS name (or null). Uses the ens_cache table. */
export async function resolveNames(addresses) {
  const unique = [...new Set(addresses.filter((a) => a && a !== ZERO))]
  const names = {}
  if (unique.length === 0) return names

  const sql = getSql()
  const cached = await sql`
    SELECT address, name FROM ens_cache
    WHERE address = ANY(${unique}::text[])
      AND updated_at > now() - make_interval(days => ${CACHE_DAYS})
  `
  for (const row of cached) names[row.address] = row.name

  const missing = unique.filter((a) => !(a in names)).slice(0, MAX_LOOKUPS_PER_REQUEST)
  if (missing.length === 0) return names

  const results = await Promise.all(
    missing.map(async (address) => {
      try {
        return [address, await getProvider().lookupAddress(address)]
      } catch {
        return [address, undefined] // RPC hiccup: don't cache, try again next time
      }
    })
  )

  const toCache = results.filter(([, name]) => name !== undefined)
  for (const [address, name] of toCache) names[address] = name
  if (toCache.length) {
    await sql`
      INSERT INTO ens_cache (address, name, updated_at)
      SELECT t.address, t.name, now()
      FROM unnest(${toCache.map((r) => r[0])}::text[], ${toCache.map((r) => r[1])}::text[]) AS t(address, name)
      ON CONFLICT (address) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
    `
  }
  return names
}
