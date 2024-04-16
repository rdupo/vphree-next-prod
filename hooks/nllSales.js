import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Network, Alchemy } from 'alchemy-sdk';
import nllAddy from '../utils/nllAddy'
import nllAbi from '../utils/nllAbi'

const getNllSales = () => {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const settings = {
    apiKey: alcKey,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  const [txn, setTxn] = useState([]);
  const [nllSales, setSales] = useState([]);
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);

  const fetchTransactionHistory = async () => {
    const retry = async (fn, maxRetries = 5) => {
      let retries = 0;
      while (retries < maxRetries) { 
        try {
          return await fn();
        } catch (error) {
          console.error(`Error fetching data (retry ${retries + 1}):`, error.message);
          retries++;
        }
      }
      throw new Error(`Max retries (${maxRetries}) exceeded.`);
    };

    const transformMarketplaceEvent = (event) => {         
      for(let i = 0; i < event.length; i++) {
        combinedEvents.push({
          amount: Number(ethers.utils.formatUnits(event[i].args.value._hex,18)).toFixed(3),
          tokenId: ethers.utils.formatUnits(event[i].args.phunkIndex._hex,0),
          timestamp: event[i].blockNumber,
        });
      }
    };

    const marketplaceContract = new ethers.Contract(nllAddy, nllAbi, provider);
    const filterSale = marketplaceContract.filters.PhunkBought(null, null, null, null);
    const Sales = await retry(async () => await marketplaceContract.queryFilter(filterSale));

    // Combine all events
    const combinedEvents = [];
    transformMarketplaceEvent(Sales);
    
    // Sort combinedEvents array by timestamp
    combinedEvents.sort((a, b) => b.timestamp - a.timestamp);
    const filteredEvents = combinedEvents.filter(item => item.amount !== '0.000').slice(0,20);
    
  
    const formattedEvents = filteredEvents.map(event => {
      return {
        price: event.amount,
        atts: '',
        id: event.tokenId,
        coll: 'phunk',
      };
    });

    setSales(formattedEvents);
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  return { nllSales };
};

export default getNllSales;