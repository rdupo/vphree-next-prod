// Run one incremental sync to the chain head. Usage: npm run sync
import { run } from './env'
import { syncIncremental } from '../lib/indexer/sync'
import { getSyncState } from '../lib/indexer/store'

run(async () => {
  if (!(await getSyncState())) {
    throw new Error('No sync state yet. Run `npm run backfill` first.')
  }
  console.log(await syncIncremental())
})
