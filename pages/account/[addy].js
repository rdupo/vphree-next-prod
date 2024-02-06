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
import { getNFTs } from '../../utils/getNFTs2'
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'

export default function V3Phunks() {
  const router = useRouter()
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const walletAddy = router.query.addy || ''
  const [nfts, setNFTs] = useState([]);
  const [pendingWithdrawAmt, setPendingWithdrawAmt] = useState('')
  const marketContract = v3MarketAddy
  const marketAbi = v3MarketAbi
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const [signer, setSigner] = useState([]);
  const contract = new ethers.Contract(marketContract, marketAbi, provider);
  const { connectedAddress, walletChanged } = useWallet();
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>

  const txnToast = (x, y) => {
    if (!(x instanceof Promise)) {
      // If x is not a promise, you can handle it here
      console.error('txnToast error: x is not a promise');
      return;
    }

    toast.promise(x, {
      loading: y + ' (Awaiting user confirmation)...',
      success: 'Blockchain confirmation pending...',
      error: '⚠️ Transaction failed! ⚠️',
      position: 'top-center',
    },
    {
      style: {
        minWidth: '80%',
        color: '#000',
        background: '#ffb900',
      },
      success: {
        duration:3600000,
        icon:hourglass,
      },
      loading: {
        icon:hourglass,
      },
      error: {
        icon:"",
      }
    });
  };

  async function fetchNFTs(x) {
    const thisAddy = x;
    const nftIds = await getNFTs(thisAddy);
    const pWith = await contract.pendingWithdrawals(thisAddy);
    const withEth = Number(Number(pWith._hex)/1000000000000000000).toFixed(3);
    setPendingWithdrawAmt(withEth);
    setNFTs(nftIds);
  }

  useEffect(() => {
    fetchNFTs(router.query.addy);
  }, [walletAddy, connectedAddress]);

  // Fetch NFTs whenever the wallet changes
  useEffect(() => {
    if (walletChanged) {
      Router.push({pathname: `/account/${connectedAddress}`})
    }
  }, [connectedAddress, walletChanged]);

  //withdraw() function
  async function withdrawMyEth() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const withdrawPromise = cpmp.withdraw();
    txnToast(withdrawPromise, `Withdrawing ${pendingWithdrawAmt}Ξ`);
    await withdrawPromise
    .then(async (result) => {
      const rh = result.hash
      await mmp.waitForTransaction(rh).then((listReceipt) => {
        if (listReceipt.status === 1) { // Check if listing transaction was successful
          toast.dismiss();
          toast('Transaction confirmed!', {
            style: {
              minWidth: '80%',
              color: '#000',
              background: '#ffb900',
            },
          });
          fetchDataWithRetry();
        } else {
          toast.dismiss();
          toast('⚠️ Transaction failed! ⚠️', {
            style: {
              minWidth: '80%',
              color: '#000',
              background: '#ffb900',
            },
          });
        }
      });
    });
  }

  //withdraw
  async function withdraw() {
    if(signer) {
      withdrawMyEth()
    }
  }

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
          { connectedAddress === walletAddy && pendingWithdrawAmt > 0 ?
            <div className="my-2">
              <button 
                className="cta v3-b black-bg v3-txt"
                onClick={() => {withdraw()}}
              >
                WITHDRAW {pendingWithdrawAmt}Ξ
              </button>
            </div>
            :
            null
          }
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