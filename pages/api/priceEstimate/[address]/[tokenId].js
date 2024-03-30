// pages/api/priceEstimate/[address]/[tokenId].js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { address, tokenId } = req.query;

  try {
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': '4525eb8ace041b7c6cda9a0c6c44c1ff'
      }
    };

    const url = `https://api.nftbank.run/v1/nft/${address}/${tokenId}/estimate?networkId=ethereum`;
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
