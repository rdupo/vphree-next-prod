import { React, useEffect } from 'react'
import Link from 'next/link'
import Header from  '../components/Header'
import Footer from '../components/Footer'
import { Silkscreen, Montserrat } from 'next/font/google'
import { ethers } from 'ethers'

export default function Home() {
  return (
    <>
      <Header/>
      <div className="content bg-opacity-60 bg-black">
        <div className="home-wrapper">
          <h2 className="home-title g-txt">About vPhree</h2>
          <p className="collection-desc text-l w-75">vPhree started as a phee-less marketplace currently supporting v3 Phunk NFTs, which builds off the foundation created by the <a href="https://notlarvalabs.com/" target="_blank">NotLarvaLabs</a> team. Since its launch, vPhree has evolved into a Phunky Hub showcasing community-built solutions including: Treasury Propositions, Flywheel, Auction House, and Not Larva Labs. In addition, our updated Dashboard allows users to view the Philips, CryptoPhunks, and v3Phunks owned along with Not Larva Labs and vPhree activity. 
            <br/>
            <br/>
            In the spirit of Phunkism, the project is entirely open source. Below we&apos;ve linked to the GitHub repos for both the vPhree marketplace frontend and CryptoPhunks Marketplace solidity contract, as well as provided the Etherscan link for the contract currently used for vPhree. 
            <br/>
            <br/>
            Go forth and build! ✊
          <br/>
          <br/>
          <a className="text-xl" href="https://github.com/rdupo/vphree-next-dev" target="_blank">vPhree Repo</a>
          <br/>
          <a className="text-xl" href="https://github.com/Crypto-Phunks/CryptoPhunksMarket" target="_blank">CryptoPhunks Marketplace Repo</a>
          <br/>
          <a className="text-xl" href="https://etherscan.io/address/0xAcCDD31413e3aD25AFF71394dFE68E17306580B5" target="_blank">vPhree Contract</a>
          </p>
        </div>
      </div>
      <div className="home-bg fixed top-0 left-0 right-0 -z-10"></div>
      <Footer
        bg='black'
      />     
    </>
  )
}