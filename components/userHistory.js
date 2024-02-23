import React from 'react';
import Image  from 'next/image';

const History = ({ transactions }) => {
  return (
    <div>
      {transactions.length > 0 ?
        (<table className="collection-desc w-full text-left mb-20">
          <thead>
            <tr className="v3-txt black-bg">
              <th>Event</th>
              <th>Phunk</th>
              <th>Amount</th>
              <th>From</th>
              <th>To</th>
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
                {typeof(transaction.tokenId && transaction.imgRef) !== 'undefined' ?                
                  <td>
                    <div>
                      <Image
                        src={`/phunks/phunk${transaction.imgRef}.svg`}
                        alt={`Image of phunk #${transaction.tokenId}`}
                        height={30}
                        width={30}
                        className="inline-flex align-bottom mr-1"
                      />
                      {`#${transaction.tokenId}`}
                    </div>
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
                  <td>
                    {transaction.from.substr(0,4) +
                    '...' +
                    transaction.from.substr(transaction.from.length - 4, transaction.from.length)}
                  </td>
                  :
                  <td>
                    ---
                  </td>
                }
                {typeof(transaction.to) !== 'undefined' && transaction.eventType != 'Listed' ?                
                  <td>
                    {transaction.to.substr(0,4) +
                    '...' +
                    transaction.to.substr(transaction.to.length - 4, transaction.to.length)}
                  </td>
                  :
                  <td>
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
        (<p className="text-2xl text-gray-400 my-4">You do not have any vPhree transactions.</p>)
      }
    </div>
  );
};

export default History;      