// pages/api/priceEstimate.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.nftbank.run/v1/nft/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/9899/estimate?networkId=ethereum');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
