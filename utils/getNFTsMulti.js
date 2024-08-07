import { React, useState } from 'react';
import { ethers } from 'ethers';
import { Alchemy } from 'alchemy-sdk';
import v3PhunkAbi from '../utils/v3PhunkAbi';
import v3PhunkAddy from '../utils/v3PhunkAddy';
import philipAbi from '../utils/philipAbi';
import philipAddy from '../utils/philipAddy';
import phunkAbi from '../utils/phunkAbi';
import phunkAddy from '../utils/phunkAddy';
import wrapperAddy from '../utils/wrapperAddy';
import wrapperAbi from '../utils/wrapperAbi';

export async function getNFTs(walletAddy, collection) {
  let cAddy, cAbi;

  if (collection === 'v1') {
    cAddy = philipAddy;
    cAbi = philipAbi
  } else if (collection === 'v2') {
    cAddy = phunkAddy;
    cAbi = phunkAbi;
  } else if (collection === 'wv1') {
    cAddy = wrapperAddy;
    cAbi = wrapperAbi;
  } else {
    cAddy = v3PhunkAddy;
    cAbi = v3PhunkAbi;
  }

  if(walletAddy.length > 1 && typeof(walletAddy) !== 'undefined') {
    const alcKey = process.env.NEXT_PUBLIC_API_KEY;
    const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
    const contract = new ethers.Contract(cAddy, cAbi, provider);

    const filterTo = contract.filters.Transfer(null, walletAddy, null);
    const filterFrom = contract.filters.Transfer(walletAddy, null, null);

    const transferEventsToWallet = await contract.queryFilter(filterTo);
    const transferEventsFromWallet = await contract.queryFilter(filterFrom);

    const idsToWallet = transferEventsToWallet.map(event => event.args.tokenId._hex);
    const idsFromWallet = transferEventsFromWallet.map(event => event.args.tokenId._hex);
    //console.log("IDs To Wallet: ", idsToWallet);
    //console.log("IDs From Wallet: ", idsFromWallet);

    // Count occurrences of each ID in idsFromWallet
    const countMap = idsFromWallet.reduce((map, id) => {
      map.set(id, (map.get(id) || 0) + 1);
      return map;
    }, new Map());

    // Subtract counts of IDs in idsFromWallet from idsToWallet
    const idsInWallet = idsToWallet.filter(id => {
      const count = countMap.get(id) || 0;
      if (count > 0) {
        countMap.set(id, count - 1);
        return false;
      }
      return true;
    });

    //console.log("IDs In Wallet: ", idsInWallet);

    const idsAsNumbers = idsInWallet.map(hexString => parseInt(hexString, 16));

    return idsAsNumbers;
  }
}

async function getTransferEvents(contract, toAddress, fromAddress) {
  const filter = contract.filters.Transfer(fromAddress, toAddress);
  const transferEvents = await contract.queryFilter(filter);
  return transferEvents;
}
