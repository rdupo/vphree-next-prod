// Load full event history from Etherscan. Usage: npm run backfill [-- --from <block>]
import { run } from './env'
import { backfill } from '../lib/indexer/sync'

run(async () => {
  const fromIdx = process.argv.indexOf('--from')
  const fromBlock = fromIdx > -1 ? Number(process.argv[fromIdx + 1]) : 0

  const started = Date.now()
  await backfill({ fromBlock })
  console.log(`Finished in ${Math.round((Date.now() - started) / 1000)}s`)
})
