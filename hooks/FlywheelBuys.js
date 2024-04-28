import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Network, Alchemy } from 'alchemy-sdk';
import flywheelAddy from '../utils/flywheelAddy'
import flywheelAbi from '../utils/flywheelAbi'

const getFlywheelBuys = () => {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const settings = {
    apiKey: alcKey,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  const [txn, setTxn] = useState([]);
  const [flywheelSales, setFlywheelSales] = useState([]);
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
          amount: Number(ethers.utils.formatUnits(event[i].args.minSalePrice._hex,18)).toFixed(3),
          tokenId: ethers.utils.formatUnits(event[i].args.phunkId._hex,0),
          timestamp: event[i].blockNumber,
        });
      }
    };

    const flywheelContract = new ethers.Contract(flywheelAddy, flywheelAbi, provider);
    const filterSale = flywheelContract.filters.PhunkSoldViaSignature(null, null, null, null);
    const Sales = await retry(async () => await flywheelContract.queryFilter(filterSale));

    // Combine all events
    const combinedEvents = [];
    transformMarketplaceEvent(Sales);
    
    // Sort combinedEvents array by timestamp
    combinedEvents.sort((a, b) => b.timestamp - a.timestamp);
    const filteredEvents = combinedEvents.filter(item => item.amount !== '0.000').slice(0,24);
    
  
    const formattedEvents = filteredEvents.map(event => {
      let alt_id;
      let s_id = event.tokenId.toString();

      if (s_id.length === 1) {
        alt_id = "000" + s_id;
      } else if (s_id.length === 2) {
        alt_id = "00" + s_id;
      } else if (s_id.length === 3) {
        alt_id = "0" + s_id;
      } else {
        alt_id = s_id;
      }

      return {
        price: event.amount,
        atts: '',
        id: alt_id,
        coll: 'phunk',
      };
    });

    setFlywheelSales(formattedEvents);
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  return { flywheelSales };
};

export default getFlywheelBuys;