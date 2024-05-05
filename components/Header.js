import { React, useState, useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '../assets/vphree24.png'
import Wallet from '../assets/wallet.png'
import Profile from '../assets/profile-icon.png'
import Discord from '../assets/discord.png'
import Info from '../assets/info.png'
import PH from '../assets/ph.png'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'

const Header = () => {
	const router = useRouter();
  const { connectedAddress, setConnectedAddress, walletChanged, setWalletChanged } = useWallet();

  useEffect(() => {
	  //console.log('connectedAddress:', connectedAddress);
	  //console.log('walletChanged:', walletChanged);

	  // Update connectedWallet in the page whenever it changes
	  if (walletChanged) {
	    //console.log('Re-rendering page...');
	    setWalletChanged(false); // Reset walletChanged to false
	  }
	}, [connectedAddress, walletChanged, setWalletChanged]);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const mmp = new ethers.providers.Web3Provider(window.ethereum);
        const signer = mmp.getSigner(accounts[0]);       
        const address = await signer.getAddress();
        setConnectedAddress(address); // Update the state with the connected address
      } catch (error) {
        console.log('MetaMask not found or error:', error);
      }
    }
  }

	return 	(
		<div className="v3-txt black-bg flex">
			<div className="mr-auto">
				<Link href="/" className="sans-underline">
					<Image
						height={40} 
						className="inline-flex align-middle my-3 ml-8 h-img" 
						src={Logo}
						alt="vphree logo"
					/>
					<h1 className="inline-flex align-middle h-txt ml-2">vphree</h1>
				</Link>
			</div>
			<div className="justify-content-end">
				<Link href="/about" className="sans-underline">
					<Image 
						height={30}
						className="inline-flex align-middle my-3 mr-5 h-img-w" 
						src={Info}
						alt="site info icon"
					/>
				</Link>
				<Link href="/hub/philip-intern-project" className="sans-underline">
					<Image 
						height={30}
						className="inline-flex align-middle my-3 mr-5 h-img-w" 
						src={PH}
						alt="site info icon"
					/>
				</Link>
				{/*<a href="https://discord.gg/hMC6cxBg3u" target="_blank" className="sans-underline">
					<Image
						height={30} 
						className="inline-flex align-middle my-3 mr-5 h-img-w" 
						src={Discord}
						alt="discord link icon"
					/>
				</a>*/}
				<Image 
					height={30}
					className="inline-flex align-middle my-3 mr-5 h-img-w brite" 
					src={Wallet}
					alt="connect wallet icon"
					onClick={connectWallet}
				/>
				{ connectedAddress.length === 0 ?
					null : 
					<Image
						height={40}
						className="inline-flex align-middle my-3 mr-8 h-img brite" 
						src={Profile}
						alt="profile icon"
						onClick={() => {Router.push({pathname: `/dashboard/${connectedAddress}`})}}
					/>
				}
			</div>
		</div>
	)
} 

export default Header