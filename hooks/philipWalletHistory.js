import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Network, Alchemy } from 'alchemy-sdk';
import philipMarketAddy from '../utils/philipMarketAddy'
import philipMarketAbi from '../utils/philipMarketAbi'

const getPhilipHistory = (wallet) => {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const settings = {
    apiKey: alcKey,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  const [txn, setTxn] = useState([]);
  const [philipTxnHistory, setPhilipTxnHistory] = useState([]);
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

    const contract = new ethers.Contract(philipMarketAddy, philipMarketAbi, provider);

    const filterList = contract.filters.PhunkOffered(null, null, wallet, null); //listed
    const filterOffer = contract.filters.PhunkBidEntered(null, null, wallet); //bid entered
    const filterWithdraw = contract.filters.PhunkBidWithdrawn(null, null, wallet); //bid withdrawn
    const filterSold = contract.filters.PhunkBought(null, null, wallet, null); //sold
    const filterBought = contract.filters.PhunkBought(null, null, null, wallet); //bought

    const List = await retry(async () => await contract.queryFilter(filterList));
    const Offer = await retry(async () => await contract.queryFilter(filterOffer));
    const Withdraw = await retry(async () => await contract.queryFilter(filterWithdraw));
    const Sold = await retry(async () => await contract.queryFilter(filterSold));
    const Bought = await retry(async () => await contract.queryFilter(filterBought));
    const marketplaceEvents = [...List, ...Offer, ...Withdraw, ...Sold, ...Bought];

    // Check if any of the event arrays is empty
    if (Offer.length === 0 && Withdraw.length === 0 && Sold.length === 0 && Bought.length === 0) {
      // Handle the case where no events are returned
      setPhilipTxnHistory([{eventType:'none'}]);
      return;
    }

    // Combine all events
    const combinedEvents = [];
    transformMarketplaceEvent(marketplaceEvents);
    
    // Sort combinedEvents array by timestamp
    combinedEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Filter out events with the same timestamp as in transactionHistory
    const refilteredEvents = combinedEvents.filter(event => {
      return !philipTxnHistory.some(prevEvent => prevEvent.timestamp === event.timestamp);
    });
  
    const formattedEvents = refilteredEvents.map(async event => {
      let eventType;

      if (event.eventType === 'PhunkOffered') {
        eventType = 'Listed';
      } else if (event.eventType === 'PhunkBought' && event.from.toLowerCase() === wallet.toLowerCase()) {
        eventType = 'Sold';
      } else if (event.eventType === 'PhunkBidEntered') {
        eventType = 'Bid'
      } else if (event.eventType === 'PhunkBidWithdrawn') {
        eventType = 'Bid Withdrawn'
      } else if (event.eventType === 'PhunkBought' && event.to.toLowerCase() === wallet.toLowerCase()) {
        eventType = 'Bought'
      }

      const fromENS = await resolveENS(event.from);
      const toENS = await resolveENS(event.to);

      let alt_id;
      const s_id = event.tokenId.toString();
        if (s_id.length === 1) {
          alt_id = "000"+s_id
        } else if (s_id.length === 2) {
          alt_id = "00"+s_id
        } else if (s_id.length === 3) {
          alt_id = "0"+s_id
        } else {
          alt_id = s_id
        }

      return {
        from: fromENS || event.from,
        to: toENS || event.to,
        eventType: eventType,
        amount: event.amount,
        hash: event.hash,
        tokenId: event.tokenId,
        imgRef: alt_id,
      };
    });

    Promise.all(formattedEvents).then((results) => {
      if (results.length > 0) {
        setPhilipTxnHistory(results);
        //console.log('txn', philipTxnHistory);
      }
    });
  };

  useEffect(() => {
    if(typeof(wallet) !== 'undefined' && wallet.length > 1) {
      fetchTransactionHistory();
    }
  }, [wallet]);

  return { philipTxnHistory };
};

export default getPhilipHistory;