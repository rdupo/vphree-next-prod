// pages/index.js - template from chatgpt
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import v3MarketAbi from '../utils/v3MarketAbi';
import v3MarketAddy from '../utils/v3MarketAddy';

export default function Home() {
  const [activeListings, setActiveListings] = useState([]);

  useEffect(() => {
    const alcKey = process.env.NEXT_PUBLIC_API_KEY
    const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
    const contractAddress = v3MarketAddy;
    const contract = new ethers.Contract(contractAddress, v3MarketAbi, provider);

    const fetchInitialActiveListings = async () => {
      const phunkOfferedFilter = contract.filters.PhunkOffered();
      const phunkNoLongerForSaleFilter = contract.filters.PhunkNoLongerForSale();

      const initialPhunkOfferedEvents = await contract.queryFilter(phunkOfferedFilter);
      const initialPhunkNoLongerForSaleEvents = await contract.queryFilter(phunkNoLongerForSaleFilter);

      const initialActiveListings = [];

      initialPhunkOfferedEvents.forEach(event => {
        const phunkIndex = event.args.phunkIndex;
        initialActiveListings.push(phunkIndex);
      });

      initialPhunkNoLongerForSaleEvents.forEach(event => {
        const phunkIndex = event.args.phunkIndex;
        const indexToRemove = initialActiveListings.indexOf(phunkIndex);
        if (indexToRemove !== -1) {
          initialActiveListings.splice(indexToRemove, 1);
        }
      });

      setActiveListings(initialActiveListings);
    };

    const phunkOfferedListener = contract.on('PhunkOffered', (fromAddress, phunkIndex, minValue) => {
      setActiveListings(listings => [...listings, phunkIndex]);
    });

    const phunkNoLongerForSaleListener = contract.on('PhunkNoLongerForSale', (phunkIndex) => {
      setActiveListings(listings => listings.filter(index => index !== phunkIndex));
    });

    fetchInitialActiveListings();

    return () => {
      phunkOfferedListener.removeAllListeners();
      phunkNoLongerForSaleListener.removeAllListeners();
    };
  }, []);

  return (
    <div>
      <ul>
        {activeListings.map((listingIndex) => (
          <li key={listingIndex}>Listing Index: {listingIndex}</li>
        ))}
      </ul>
    </div>
  );
}

