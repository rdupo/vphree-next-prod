import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Network, Alchemy } from 'alchemy-sdk';
import v3MarketAddy from '../utils/v3MarketAddy'
import v3MarketAbi from '../utils/v3MarketAbi'
import v3PhunkAddy from '../utils/v3PhunkAddy'
import v3PhunkAbi from '../utils/v3PhunkAbi'

const getWalletHistory = (wallet) => {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const settings = {
    apiKey: alcKey,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(settings);
  const [txn, setTxn] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const v3Abi = v3PhunkAbi
  const mpAbi = v3MarketAbi

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

    const nftContract = new ethers.Contract(v3PhunkAddy, v3Abi, provider);
    const marketplaceContract = new ethers.Contract(v3MarketAddy, mpAbi, provider);

    const filterList = marketplaceContract.filters.PhunkOffered(null, null, wallet, null); //listed
    const filterOffer = marketplaceContract.filters.PhunkBidEntered(null, null, wallet); //bid entered
    const filterWithdraw = marketplaceContract.filters.PhunkBidWithdrawn(null, null, wallet); //bid withdrawn
    const filterSold = marketplaceContract.filters.PhunkBought(null, null, wallet, null); //sold
    const filterBought = marketplaceContract.filters.PhunkBought(null, null, null, wallet); //bought
    //const filterV3 = nftContract.filters.Transfer(null, null, id);

    const List = await retry(async () => await marketplaceContract.queryFilter(filterList));
    const Offer = await retry(async () => await marketplaceContract.queryFilter(filterOffer));
    const Withdraw = await retry(async () => await marketplaceContract.queryFilter(filterWithdraw));
    const Sold = await retry(async () => await marketplaceContract.queryFilter(filterSold));
    const Bought = await retry(async () => await marketplaceContract.queryFilter(filterBought));
    const marketplaceEvents = [...List, ...Offer, ...Withdraw, ...Sold, ...Bought];
    //const nftEvents = await retry(async () => await nftContract.queryFilter(filterV3));

    // Check if any of the event arrays is empty
    if (List.length === 0 && Offer.length === 0 && Withdraw.length === 0 && Sold.length === 0 && Bought.length === 0) {
      // Handle the case where no events are returned
      setTransactionHistory([{eventType:'none'}]);
      return;
    }

    // Combine all events
    const combinedEvents = [];
    transformMarketplaceEvent(marketplaceEvents);
    //transformNFTEvent(nftEvents);
    
    // Sort combinedEvents array by timestamp
    combinedEvents.sort((a, b) => b.timestamp - a.timestamp);
    //console.log('combined, sorted', combinedEvents)

    // Filter out events with the same timestamp as in transactionHistory
    const refilteredEvents = combinedEvents.filter(event => {
      return !transactionHistory.some(prevEvent => prevEvent.timestamp === event.timestamp);
    });
  
    const formattedEvents = refilteredEvents.map(async event => {
      let eventType;
      /*if (event.from == '0x0000000000000000000000000000000000000000') {
        eventType = 'Mint';
      }
      else if (event.eventType === 'Transfer') {
        eventType = 'Transfer';
      } else*/ 
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
    //console.log('events', formattedEvents);

    /*if (formattedEvents.length > 0) {
      setTransactionHistory(formattedEvents);
    }*/

    Promise.all(formattedEvents).then((results) => {
      if (results.length > 0) {
        setTransactionHistory(results);
      }


    });
  };

  useEffect(() => {
    if(typeof(wallet) !== 'undefined' && wallet.length > 1) {
      fetchTransactionHistory();
    }
  }, [wallet]);

  return { transactionHistory };
};

export default getWalletHistory;