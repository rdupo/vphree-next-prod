// pages/index.js - template from chatgpt
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import contractABI from '../path/to/contractABI.json'; // Replace with the actual path

export default function Home() {
  const [activeListings, setActiveListings] = useState([]);

  useEffect(() => {
    const provider = new ethers.providers.JsonRpcProvider('https://eth-goerli.g.alchemy.com/v2/Xq9-5SRgOVU_UxK6uHdIk-oNvvO_n1iZ',5);
    const contractAddress = '0x101F2256ba4db70F2659DC9989e0eAFb4Fd53829';
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

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

