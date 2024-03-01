import React from 'react';

const History = ({ transactions }) => {
  return (
    <div>
      <p className="metadata">History</p>
      {transactions.length > 0 ?
        (<table className="collection-desc w-full text-left mb-20">
          <thead>
            <tr className="v3-txt black-bg">
              <th>Event</th>
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
        </table>)
        :
        (<p className="v3-txt">Loading transaction history...</p>)
      }
    </div>
  );
};

export default History;      