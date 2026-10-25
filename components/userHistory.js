import React from 'react';
import Image  from 'next/image';
import Link from 'next/link';

// Indexer collection slug -> display name and token detail route
const COLLECTIONS = {
  'philip-intern-project': { name: 'Philips', route: 'philip' },
  'cryptophunks': { name: 'CryptoPhunks', route: 'cryptophunk' },
  'wrapped-v1-phunks': { name: 'Wrapped v1s', route: 'wrapped-v1-phunk' },
  'v3-phunks': { name: 'v3 Phunks', route: 'v3phunk' },
};

const History = ({ transactions, mp, showCollection = false }) => {
  //{console.log(transactions)}
  return (
    <div>
      {transactions && transactions.length > 0 && transactions[0].eventType !== 'none' ?
        (<div className="history-table-wrap mb-20">
        <table className="collection-desc w-full text-left bg-black">
          <thead>
            <tr className="g-txt black-bg">
              <th>Event</th>
              {showCollection ? <th>Collection</th> : null}
              <th>Phunk</th>
              <th>Amount</th>
              <th className="t-from">From</th>
              <th className="t-to">To</th>
              <th>View Txn</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={index}>
                {typeof(transaction.eventType) !== 'undefined' ?
                  <td>
                    {transaction.eventType}
                  </td>
                  : 
                  <td>
                    ---
                  </td>
                }
                {showCollection ?
                  <td>{COLLECTIONS[transaction.collection]?.name || '---'}</td>
                  : null
                }
                {typeof(transaction.tokenId && transaction.imgRef) !== 'undefined' ?
                  <td>
                    <Link href={COLLECTIONS[transaction.collection] ? `/${COLLECTIONS[transaction.collection].route}/${transaction.tokenId}` : '#'}>
                      <Image
                        src={`/phunks/phunk${transaction.imgRef}.svg`}
                        alt={`Image of phunk #${transaction.tokenId}`}
                        height={30}
                        width={30}
                        className="inline-flex align-bottom mr-1"
                      />
                      {`#${transaction.tokenId}`}
                    </Link>
                  </td>
                  :
                  <td>
                    ---
                  </td>
                }
                {typeof(transaction.amount) !== 'undefined' ?                
                  <td>
                    {transaction.amount > 0 ? Number(transaction.amount).toFixed(3) + "Ξ" : "---"}
                  </td>
                  :
                  <td>
                    ---
                  </td>
                }
                {typeof(transaction.from) !== 'undefined' ?                
                  <td className="t-from">
                    {transaction.from.indexOf('.eth') > -1 ?
                      transaction.from 
                      :
                      transaction.from.substr(0,4) +
                      '...' +
                      transaction.from.substr(transaction.from.length - 4, transaction.from.length)
                    }
                  </td>
                  :
                  <td className="t-from">
                    ---
                  </td>
                }
                {typeof(transaction.to) !== 'undefined' && transaction.eventType != 'Listed' ?                
                  <td className="t-to">
                    {transaction.to.indexOf('.eth') > -1 ? 
                      transaction.to
                      :
                      transaction.to.substr(0,4) +
                      '...' +
                      transaction.to.substr(transaction.to.length - 4, transaction.to.length)
                    }
                  </td>
                  :
                  <td className="t-to">
                    ---
                  </td>
                }
                {typeof(transaction.hash) !== 'undefined' ?                
                  <td>
                    {<a
                      href={`https://etherscan.io/tx/${transaction.hash}`}
                      target='_blank'
                    >
                    {transaction.hash.substr(0,4) +
                    '...' + 
                    transaction.hash.substr(transaction.hash.length - 4, transaction.hash.length)}
                    </a>}
                  </td>
                  :
                  <td>
                    ---
                  </td>
                }
              </tr>
            ))}
          </tbody>
        </table>
        </div>)
        :
        transactions && transactions[0] && transactions[0].eventType === 'none' 
        ?
        <p className="text-2xl text-gray-400 my-4">You do not have any {mp} transactions.</p>
        :
        <p className="text-2xl g-txt my-4">Loading {mp} transaction history...</p>
      }
    </div>
  );
};

export default History;      