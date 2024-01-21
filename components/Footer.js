import React from 'react'

const Footer = ({ bg }) => {
	let tcBg;

	if (typeof(bg) === 'undefined') {
		tcBg = 'collection-desc pb-2 px-8'
	} else {
		tcBg = 'collection-desc pb-2 px-8 black-bg'
	}

	return (
		<div>
			<div className={tcBg}>
				<p>vPhree is provided on an &#34;as is&#34; and &#34;as available&#34; basis. The vPhree Team does not give any warranties and will not be liable for any loss, direct or indirect, through continued use of this app.</p>
			</div>
			<div className="footer black-bg drk-grey-txt px-8 flex">
				<p>Be phree. Be phunky. Shout out to the <a href="https://notlarvalabs.com" target="_blank">NotLarvaLabs</a> team for paving the way ✊</p>
			</div>
		</div>
	)
}

export default Footer