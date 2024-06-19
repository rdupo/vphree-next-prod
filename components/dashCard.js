import React, { useState } from 'react';
import Image from 'next/image';
import Router from 'next/router';

const DashCard = ({ price, bid, atts, id, coll }) => {
  let alt_id, collName;
  let s_id = id.toString();
  let displayPrice;
  let bidPrice;

  if (coll === "v1") {
    collName = "philip";
  } else if (coll === "wv1") {
    collName = "wrapped-v1-phunk";
  }else if (coll === "v2") {
    collName = "https://notlarvalabs.com/cryptophunks/details/";
  } else if (coll === "v3") {
    collName = "v3phunk";
  } else {
    collName = "";
  }

  if (s_id.length === 1) {
    alt_id = "000" + s_id;
  } else if (s_id.length === 2) {
    alt_id = "00" + s_id;
  } else if (s_id.length === 3) {
    alt_id = "0" + s_id;
  } else {
    alt_id = s_id;
  }

  price === '' ? displayPrice = 'unlisted' : displayPrice = price + 'Ξ'
  bid === '' ? bidPrice = 'no bids' : bidPrice = 'bid: ' + bid + 'Ξ'

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Define variables for dynamic values
  let imageSrc;
  let imageClassName;
  let idClassName;

  // Set values based on hover state and coll value
  if ((isHovered && coll === 'v1') || coll === 'wv1') {
    // philip hover state
    imageSrc = `/phunks/phunk${alt_id}.svg`;
    imageClassName = 'img-wrapper v1-bg';
    idClassName = 'phunk-id mb-0 v1-txt';
  } else if (!isHovered && coll === 'v1') {
  	// philip default state
	  imageSrc = '/phunks/philip.png';
    imageClassName = 'img-wrapper philip-bg';
    idClassName = 'phunk-id mb-0 philip-txt';
  } else if (coll === 'v2') {
    imageSrc = `/phunks/phunk${alt_id}.svg`;
    imageClassName = 'img-wrapper v2-bg';
    idClassName = 'phunk-id mb-0 v2-txt';
  } else {
    // Values for v3 phunks; default
    imageSrc = `/phunks/phunk${alt_id}.svg`;
    imageClassName = 'img-wrapper v3-bg';
    idClassName = 'phunk-id mb-0 v3-txt';
  }

  return (
    <div
      key={id}
      className="brite my-2 black-bg white-txt inline-block sans-underline"
      data-price={price}
      data-atts={atts}
      onClick={() => {
        if(coll === 'v2'){
          const nllLink = `${collName}${id}`;
          window.open(nllLink, '_blank');
        } else {
          Router.push({ pathname: `/${collName}/${id}` });
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={imageClassName}>
        <Image
          className="w-100"
          src={imageSrc}
          loading="lazy"
          alt={`phunk ${id}`}
          height="100"
          width="100"
        />
      </div>
      <div className="card-info-wrapper ml-2">
        <p className={idClassName}>#{id}</p>
        <p className="mb-1 text-xs">{displayPrice}</p>
        <p className="mb-1 text-xs text-gray-400">{bidPrice}</p>
      </div>
    </div>
  );
};

export default DashCard;
