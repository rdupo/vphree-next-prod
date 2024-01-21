import { ethers } from 'ethers';
import v3PhunkAbi from '../utils/v3PhunkAbi';
import v3PhunkAddy from '../utils/v3PhunkAddy';

const v3Addy = v3PhunkAddy
const v3Abi = v3PhunkAbi

export async function getNFTs(walletAddy) {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const contract = new ethers.Contract(v3Addy, v3Abi, provider);

  const transferEventsToWallet = await getTransferEvents(contract, walletAddy);
  const transferEventsFromWallet = await getTransferEvents(contract, null, walletAddy);

  // Exclude IDs that were transferred out
  const transferredOutIds = transferEventsFromWallet.map(event => event.args.tokenId.toString());
  const uniqueTransferredInIds = [...new Set(transferEventsToWallet.map(event => event.args.tokenId.toString()))];

  // Remove transferred out IDs
  const nftIds = uniqueTransferredInIds.filter(id => !transferredOutIds.includes(id));

  return nftIds;
}

async function getTransferEvents(contract, toAddress, fromAddress) {
  const filter = contract.filters.Transfer(fromAddress, toAddress);
  const transferEvents = await contract.queryFilter(filter);
  return transferEvents;
}