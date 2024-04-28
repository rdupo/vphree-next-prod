import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Network, Alchemy } from 'alchemy-sdk';
import nllAddy from '../utils/nllAddy'
import nllAbi from '../utils/nllAbi'
import phunkAddy from '../utils/phunkAddy'
import phunkAbi from '../utils/phunkAbi'

const getTxnHistory = (id) => {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const settings = {
    apiKey: alcKey,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  const [txn, setTxn] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);

  const resolveENS = async (address) => {
    try {
      const ensName = await provider.lookupAddress(address);
      return ensName;
    } catch (error) {
      console.error('Error resolving ENS name:', error.message);
      return null;
    }
  };

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
          eventType: event[i].event,
          from: event[i].args.fromAddress,
          to: event[i].args.toAddress,
          amount: typeof(event[i].args.minValue) != 'undefined' ? ethers.utils.formatUnits(event[i].args.minValue._hex,18):ethers.utils.formatUnits(event[i].args.value._hex,18),
          tokenId: ethers.utils.formatUnits(event[i].args.phunkIndex._hex,0),
          timestamp: event[i].blockNumber,
          hash: event[i].transactionHash,
        });
      }
    };

    const transformNFTEvent = (event) => {
      for(let i = 0; i < event.length; i++) {          
        combinedEvents.push({
          eventType: event[i].event,
          from: event[i].args.from,
          to: event[i].args.to,
          amount: '',
          tokenId: ethers.utils.formatUnits(event[i].args.tokenId._hex,0),
          timestamp: event[i].blockNumber,
          hash: event[i].transactionHash,
        });
      }
    };

    const nftContract = new ethers.Contract(phunkAddy, phunkAbi, provider);
    const marketplaceContract = new ethers.Contract(nllAddy, nllAbi, provider);

    const filterList = marketplaceContract.filters.PhunkOffered(id, null, null);
    const filterOffer = marketplaceContract.filters.PhunkBidEntered(id, null, null);
    const filterSale = marketplaceContract.filters.PhunkBought(id, null, null, null);
    const filterV3 = nftContract.filters.Transfer(null, null, id);

    const List = await retry(async () => await marketplaceContract.queryFilter(filterList));
    const Offer = await retry(async () => await marketplaceContract.queryFilter(filterOffer));
    //console.log('hist-offer: ', Offer);
    const Sale = await retry(async () => await marketplaceContract.queryFilter(filterSale));
    const marketplaceEvents = [...List, ...Offer, ...Sale];
    //console.log('mp events', marketplaceEvents)
    const nftEvents = await retry(async () => await nftContract.queryFilter(filterV3));

    // Combine all events
    const combinedEvents = [];
    transformMarketplaceEvent(marketplaceEvents);
    transformNFTEvent(nftEvents);
    //console.log('combined', combinedEvents)
    
    // Sort combinedEvents array by timestamp
    combinedEvents.sort((a, b) => b.timestamp - a.timestamp);
    const filteredEvents = combinedEvents.filter( i => i.tokenId.includes(id) );
    //console.log('filtered', filteredEvents)

    // Filter out events with the same timestamp as in transactionHistory
    const refilteredEvents = filteredEvents.filter(event => {
      return !transactionHistory.some(prevEvent => prevEvent.timestamp === event.timestamp);
    });
  
    const formattedEvents = refilteredEvents.map(async event => {
      let eventType;
      if (event.from == '0x0000000000000000000000000000000000000000') {
        eventType = 'Mint';
      }
      else if (event.eventType === 'Transfer') {
        eventType = 'Transfer';
      } else if (event.eventType === 'PhunkOffered') {
        eventType = 'Listed';
      } else if (event.eventType === 'PhunkBought') {
        eventType = 'Sold';
      } else if (event.eventType === 'PhunkBidEntered') {
        eventType = 'Bid'
      }

      const fromENS = await resolveENS(event.from);
      const toENS = await resolveENS(event.to);

      return {
        from: fromENS || event.from,
        to: toENS || event.to,
        eventType: eventType,
        amount: event.amount,
        hash: event.hash,
      };
    });

    Promise.all(formattedEvents).then((results) => {
      if (results.length > 0) {
        setTransactionHistory(results);
      }
    });
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, [id]);

  return { transactionHistory };
};

export default getTxnHistory;
