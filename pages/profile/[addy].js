import { React, useState, useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import Banner from '../../assets/profile-banner.png'
import Profile from '../../assets/profile-icon.png'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from "ethers"
import { getNFTs } from '../../utils/getNFTs'
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'

export default function V3Phunks() {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const router = useRouter()
  const walletAddy = router.query.addy || ''
  const [nfts, setNFTs] = useState([]);
  const marketContract = v3MarketAddy
  const marketAbi = v3MarketAbi
  const provider = new ethers.providers.JsonRpcProvider(
    `https://eth-goerli.g.alchemy.com/v2/${alcKey}`,
    5);
  const [signer, setSigner] = useState([]);
  const contract = new ethers.Contract(marketContract, marketAbi, provider);
  const { connectedAddress, walletChanged } = useWallet();

  const txnToast = (x) => {
    if (!(x instanceof Promise)) {
      // If x is not a promise, you can handle it here
      console.error('txnToast error: x is not a promise');
      return;
    }

    toast.promise(x, {
      loading: 'Transaction pending...',
      success: 'Transaction successful!',
      error: 'Transaction failed!',
      position: 'top-center',
    },
    {
      style: {
        minWidth: '80%',
        color: '#83dfb2',
        background: '#000',
      },
    });
  };

  async function fetchNFTs() {
    const thisAddy = router.query.addy;
    const nftIds = await getNFTs(thisAddy);
    setNFTs(nftIds);
  }

  useEffect(() => {
    fetchNFTs();
  },[]);

  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page">
        <div className="content px-8">
        	<h1 className="v3-txt mr-auto text-5xl mt-4">
            <Image
              height={40}
              className="inline-flex align-middle my-3 mr-4 h-img" 
              src={Profile}
              alt="profile icon"
            />
            {walletAddy.substr(0,4) + "..." + walletAddy.substr(walletAddy.length - 4, walletAddy.length)}
          </h1>
          <p className="white-txt text-xl">
            This wallet owns {nfts.length} V3 Phunks.
          </p>
        	<div className="flex flex-wrap justify-left">
	            {nfts.map((nftId) => (
	            	(typeof(nftId) != 'undefined' ?
	                <Card
                    key={`_${nftId}`}
		                price="" 
		                atts=""
		                id={nftId}
                    coll="phunk"
	                />
	              : null )  
	            ))}
        	</div>
        </div>
      </div>
      <Footer/>      
    </>
  )
}