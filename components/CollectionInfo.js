import React from 'react'
import Image from 'next/image'
import Tweet from '../assets/twitter.png'
import Etherscan from '../assets/etherscan.png'

const CollectionInfo = ({title, desc, twitter, contract}) => {
	const clink = "https://etherscan.io/address/" + contract;

	return (
		<div className="collection-info mb-10 w-9/12 px-0">
			<div className="flex">
				<h1 className="g-txt mr-auto text-5xl">{title}</h1>
				<div id="collection-links" className="justify-content-end">
					<a href={twitter} target="_blank" className="sans-underline">
						<Image 
							className="inline-flex align-middle my-3 mr-3 h-img-w brite" 
							src={Tweet}
							alt="twitter logo"/>
					</a>
					<a href={clink} target="_blank" className="sans-underline ml-3">
						<Image 
							className="inline-flex align-middle my-3 h-img-w brite" 
							src={Etherscan}
							alt="etherscan logo"/>
					</a>
				</div>
			</div>
			<div id="mobile-c-links">
				<a href={twitter} target="_blank" className="sans-underline">
					<Image 
						className="inline-flex align-middle my-3 mr-3 h-img-w brite" 
						src={Tweet}
						alt="twitter logo"/>
				</a>
				<a href={clink} target="_blank" className="sans-underline ml-3">
					<Image 
						className="inline-flex align-middle my-3 h-img-w brite" 
						src={Etherscan} 
						alt="etherscan logo"/>
				</a>
			</div>
			<div className="collection-desc">
				<p>{desc}</p>
			</div>				
		</div>
	)
}

export default CollectionInfo