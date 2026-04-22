import React from "react";

const Banner = ({ store }) => {
  return (
    <div className="store-banner">
      <h2>{store.store_name}</h2>
      <p>⭐ {store.average_rating}</p>
    </div>
  );
};

export default Banner;