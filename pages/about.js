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
      <div className="content">
        <div className="home-wrapper">
          <h2 className="home-title v3-txt">About vPhree</h2>
          <p className="collection-desc text-l w-75">vPhree is a phee-less marketplace currently supporting v3 Phunk NFTs, which builds off the foundation created by the <a href="https://notlarvalabs.com/" target="_blank">NotLarvaLabs</a> team. In the spirit of Phunkism, the project is entirely open source. Below we&apos;ve linked to the GitHub repos for both the vPhree frontend and CryptoPhunks Marketplace solidity contract, as well as provided the Etherscan link for the contract currently used for vPhree. Go forth and build! ✊
          <br/>
          <br/>
          <a className="text-xl" href="https://github.com/rdupo/vphree-next-dev" target="_blank">vPhree Repo</a>
          <br/>
          <a className="text-xl" href="https://github.com/Crypto-Phunks/CryptoPhunksMarket" target="_blank">CryptoPhunks Marketplace Repo</a>
          <br/>
          <a className="text-xl" href="https://goerli.etherscan.io/address/${}#code" target="_blank">vPhree Contract</a>
          </p>
        </div>
      </div>
      <Footer/>      
    </>
  )
}