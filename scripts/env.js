// Load .env / .env.local the same way `next dev` does, for scripts run outside Next.
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Wrap a script's async entry point with consistent error handling.
export function run(main) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
