import React, { useState } from 'react';
import Image from 'next/image';
import Router from 'next/router';

const FlywheelCard = ({ price, atts, id, minPrice }) => {
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

  return (
    <div
      key={id}
      className="brite my-2 black-bg white-txt inline-block sans-underline"
      data-price={price}
      data-atts={atts}
      onClick={() => {
        window.open('https://www.phunks.pro', '_blank');
      }}
    >
      <div className="img-wrapper v2-bg">
        <Image
          className="w-100"
          src={id === "-1" ? `/phunks/philip.png` : `/phunks/phunk${alt_id}.svg`}
          loading="lazy"
          alt={`phunk ${id}`}
          height="100"
          width="100"
        />
      </div>
      <div className="card-info-wrapper ml-2">
        <p className="phunk-id mb-0 v2-txt">{id === "-1" ? "---" : `#${id}`}</p>
        <h4 className="phunk-price">{price}</h4>
        {id === "-1" ?
          <p className ="mb-1 text-xs text-white">---</p>
          :
          Number(price) >= Number(minPrice) ? 
          <p className="mb-1 text-xs text-emerald-500">Eligible</p>
           : 
          <p className="mb-1 text-xs text-rose-500">Ineligible</p>
        }
      </div>
    </div>
  );
};

export default FlywheelCard;
