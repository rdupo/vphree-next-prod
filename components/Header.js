import { React, useState, useEffect, useRef } from 'react'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '../assets/vphree24.png'
import Wallet from '../assets/wallet.png'
import Profile from '../assets/profile-icon.png'
import Discord from '../assets/discord.png'
import PH from '../assets/ph.png'
import Market from '../assets/market.svg'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'

const Header = () => {
	const router = useRouter();
  const { connectedAddress, setConnectedAddress, disconnectWallet, walletChanged, setWalletChanged } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the wallet menu on any click outside it
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

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
        const mmp = new ethers.BrowserProvider(window.ethereum);
        const signer = await mmp.getSigner(accounts[0]);
        const address = await signer.getAddress();
        setConnectedAddress(address); // Update the state with the connected address
        sessionStorage.setItem('connectedAddress', address);
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
					<h1 className="inline-flex align-middle h-txt ml-2 txt-new-fallback">vPhree</h1>
				</Link>
			</div>
			<div className="justify-content-end">
				<Link href="/collections/all" className="sans-underline">
					<Image
						height={30}
						className="inline-flex align-middle my-3 mr-5 h-img-w"
						src={Market}
						alt="all collections icon"
					/>
				</Link>
				<Link href="/hub/philip-intern-project" className="sans-underline">
					<Image 
						height={30}
						className="inline-flex align-middle my-3 mr-5 h-img-w" 
						src={PH}
						alt="phunky hub icon"
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
				{ connectedAddress.length === 0 ?
					<Image 
						height={30}
						className="inline-flex align-middle my-3 mr-5 h-img-w brite" 
						src={Wallet}
						alt="connect wallet icon"
						onClick={connectWallet}
					/>
					 : 
					<div className="relative inline-flex align-middle mr-8" ref={menuRef}>
						<Image
							height={40}
							className="inline-flex align-middle my-3 h-img brite"
							src={Profile}
							alt="profile icon"
							onClick={() => setMenuOpen((open) => !open)}
						/>
						{menuOpen &&
							<div className="wallet-menu">
								<p
									className="g-txt cursor-pointer"
									onClick={() => {setMenuOpen(false); Router.push({pathname: `/dashboard/${connectedAddress}`})}}
								>
									Dashboard
								</p>
								<p
									className="g-txt cursor-pointer"
									onClick={() => {setMenuOpen(false); disconnectWallet()}}
								>
									Disconnect
								</p>
							</div>
						}
					</div>
				}
			</div>
		</div>
	)
} 

export default Header