import Header from '../../components/Header'
import Footer from '../../components/Footer'
import HubNav from '../../components/HubNav'

// Phunky Hub > vPhree: about the project (formerly the /about page, which now redirects here).
export default function HubVphree() {
  return (
    <>
      <Header/>
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <HubNav active="vphree"/>
          <h2 className="mt-8 mb-4 text-2xl">About vPhree</h2>
          <div className="text-gray-300 w-11/12 filter-sort-wrapper">
            <p>vPhree started as a phee-less marketplace currently supporting v3 Phunk NFTs, which builds off the foundation created by the <a href="https://notlarvalabs.com/" target="_blank">NotLarvaLabs</a> team. Since its launch, vPhree has evolved into a Phunky Hub showcasing community-built solutions including: Treasury Propositions, Flywheel, Auction House, and Not Larva Labs. In addition, our updated Dashboard allows users to view the Philips, CryptoPhunks, and v3Phunks owned along with Not Larva Labs and vPhree activity.</p>
            <br/>
            <p>In the spirit of Phunkism, the project is entirely open source. Below we&apos;ve linked to the GitHub repos for both the vPhree marketplace frontend and CryptoPhunks Marketplace solidity contract, as well as provided the Etherscan link for the contract currently used for vPhree.</p>
            <br/>
            <p>Go forth and build! ✊</p>
            <br/>
            <p><a className="text-xl" href="https://github.com/rdupo/vphree-next-dev" target="_blank">vPhree Repo</a></p>
            <p><a className="text-xl" href="https://github.com/Crypto-Phunks/CryptoPhunksMarket" target="_blank">CryptoPhunks Marketplace Repo</a></p>
            <p><a className="text-xl" href="https://etherscan.io/address/0xAcCDD31413e3aD25AFF71394dFE68E17306580B5" target="_blank">vPhree Contract</a></p>
          </div>
        </div>
      </div>
      <div className="home-bg fixed top-0 left-0 right-0 -z-10"></div>
      <Footer
        bg='black'
      />
    </>
  )
}
