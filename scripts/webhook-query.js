// Print the GraphQL query to paste into an Alchemy Custom Webhook. Usage: npm run webhook:query
import { ALL_ADDRESSES, ALL_TOPICS } from '../lib/indexer/collections'

const list = (items) => items.map((i) => `"${i}"`).join(', ')

console.log(`# Alchemy dashboard -> Webhooks -> Custom Webhook -> Ethereum Mainnet
# Webhook URL: https://<your-domain>/api/indexer/webhook
{
  block {
    number
    timestamp
    logs(filter: {
      addresses: [${list(ALL_ADDRESSES)}],
      topics: [[${list(ALL_TOPICS)}]]
    }) {
      data
      topics
      index
      account { address }
      transaction { hash }
    }
  }
}`)
