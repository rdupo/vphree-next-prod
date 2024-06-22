import { Alchemy, Network } from "alchemy-sdk";

const settings = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  network: Network.ETH_MAINNET, // or the network you are working with
};

const alchemy = new Alchemy(settings);

async function fetchNFTsForOwner(ownerAddress, contractAddress) {
  let allNFTs = [];
  let pageKey = null;

  do {
    const response = await alchemy.nft.getNftsForOwner(ownerAddress, {
      contractAddresses: [contractAddress],
      pageKey: pageKey,
    });

    allNFTs = allNFTs.concat(response.ownedNfts);

    pageKey = response.pageKey;
  } while (pageKey);

  return allNFTs;
}

export default fetchNFTsForOwner;
