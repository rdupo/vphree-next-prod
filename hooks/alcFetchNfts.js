import { Alchemy, Network } from "alchemy-sdk";
import philipAddy from "../utils/philipAddy";
import wrapperAddy from "../utils/wrapperAddy";
import phunkAddy from "../utils/phunkAddy";
import v3PhunkAddy from "../utils/v3PhunkAddy";

const settings = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  network: Network.ETH_MAINNET, // or the network you are working with
};

const alchemy = new Alchemy(settings);

async function fetchNFTsForOwner(ownerAddress) {
  let allNFTs = [];
  let pageKey = null;

  do {
    const response = await alchemy.nft.getNftsForOwner(ownerAddress, {
      contractAddresses: [philipAddy, wrapperAddy, phunkAddy, v3PhunkAddy],
      pageKey: pageKey,
    });

    allNFTs = allNFTs.concat(response.ownedNfts);

    pageKey = response.pageKey;
  } while (pageKey);

  return allNFTs;
}

export default fetchNFTsForOwner;
