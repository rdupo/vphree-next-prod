// v3 Phunk token IDs currently held by a wallet, from our indexer API.
export async function getNFTs(walletAddy) {
  if (typeof(walletAddy) !== 'undefined' && walletAddy.length > 1) {
    const res = await fetch(`/api/wallets/${walletAddy}/nfts?collection=v3-phunks`);
    if (!res.ok) return [];
    return res.json();
  }
}
