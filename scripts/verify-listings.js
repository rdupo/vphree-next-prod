// Compare indexed active listings with the marketplace contracts' current on-chain state.
// Usage: npm run verify:listings [-- <collection>]
import { run } from './env'
import { ethers } from 'ethers'
import { COLLECTIONS } from '../lib/indexer/collections'
import { getRpcUrl } from '../lib/indexer/sources'
import { getListings } from '../lib/queries'

run(async () => {
  const provider = new ethers.providers.StaticJsonRpcProvider(getRpcUrl(), 1)
  const only = process.argv[2]
  let mismatches = 0

  for (const [slug, c] of Object.entries(COLLECTIONS)) {
    if (only && slug !== only) continue
    const market = new ethers.Contract(c.market.address, c.market.abi, provider)
    const listings = await getListings(slug)

    for (const l of listings) {
      const onChain = await market.phunksOfferedForSale(l.token_id)
      const price = ethers.utils.formatEther(onChain.minValue)
      const ok = onChain.isForSale && onChain.minValue.toString() === l.value_wei
      if (!ok) {
        mismatches++
        console.log(`  MISMATCH ${slug} #${l.token_id}: db=${ethers.utils.formatEther(l.value_wei)} chain=${onChain.isForSale ? price : 'not for sale'}`)
      }
    }
    console.log(`${slug}: ${listings.length} indexed listings checked`)
  }
  console.log(mismatches ? `${mismatches} mismatches` : 'All indexed listings match the chain.')
})
