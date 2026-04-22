import React from "react";

const CategoryFilter = () => {
  const categories = ["الكل", "العناية بالبشرة", "المكياج", "الأدوات", "العناية بالجسم", "العناية بالشعر", "العناية بالرجال", "أخرى"];

  return (
    <div className="category-filter">
      {categories.map((cat, index) => (
        <button key={index}>{cat}</button>
      ))}
    </div>
  );
};

export default CategoryFilter;