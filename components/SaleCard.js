import React, { useState } from 'react';
import Image from 'next/image';
import Router from 'next/router';

const SaleCard = ({ price, atts, id, coll }) => {
  let alt_id;
  let s_id = id.toString();

  if (s_id.length === 1) {
    alt_id = "000" + s_id;
  } else if (s_id.length === 2) {
    alt_id = "00" + s_id;
  } else if (s_id.length === 3) {
    alt_id = "0" + s_id;
  } else {
    alt_id = s_id;
  }

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
  if (isHovered && coll === 'philip') {
    // philip hover state
    imageSrc = `/phunks/phunk${alt_id}.svg`;
    imageClassName = 'img-wrapper v1-bg';
    idClassName = 'phunk-id mb-0 v1-txt';
  } else if (!isHovered && coll === 'philip') {
  	// philip default state
	  imageSrc = '/phunks/philip.png';
    imageClassName = 'img-wrapper philip-bg';
    idClassName = 'phunk-id mb-0 philip-txt';
  } else {
    // Values for v3 phunks; default
    imageSrc = `/phunks/phunk${alt_id}.svg`;
    imageClassName = 'img-wrapper v3-bg';
    idClassName = 'phunk-id mb-0 v3-txt';
  }

  return (
    <div
      key={id}
      className="brite mx-1 v3-bg black-txt inline-block sans-underline"
      data-price={price}
      data-atts={atts}
      onClick={() => {
        Router.push({ pathname: `/${coll}/${id}` });
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
          height="50"
          width="50"
        />
      </div>
      <div className="card-info-wrapper mx-2">
        <h4 className="phunk-price text-xs">{price}</h4>
      </div>
    </div>
  );
};

export default SaleCard;