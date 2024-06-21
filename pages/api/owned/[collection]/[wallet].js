// pages/api/priceEstimate/[address]/[tokenId].js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  //collection = collection address
  //wallet = wallet containing NFTs from collection specified
  const { collection, wallet } = req.query;
  const alcKey = process.env.NEXT_PUBLIC_API_KEY

  try {
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      }
    };

    const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${alcKey}/getNFTsForOwner?owner=${wallet}&contractAddresses[]=${collection}&withMetadata=false&pageSize=100'`;
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};