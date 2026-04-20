import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img
        src={
          product.images?.[0]
            ? `http://127.0.0.1:8080/${product.images[0]}`
            : "/placeholder.png"
        }
        alt={product.name}
      />

      <h4>{product.name}</h4>
      <p>{product.price} ج.م</p>

      <button>أضف للسلة</button>
    </div>
  );
};

export default ProductCard;