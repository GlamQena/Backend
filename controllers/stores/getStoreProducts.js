const Product = require("../../models/product");
const { storeOwnerModel } = require("../../models/users/storeOwner");
const mongoose = require("mongoose");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSort(sortBy) {
  switch (sortBy) {
    case "oldest":     return { createdAt: 1 };
    case "price_high": return { price: -1 };
    case "price_low":  return { price: 1 };
    case "stock_high": return { stock: -1 };
    case "stock_low":  return { stock: 1 };
    case "rating_high": return { average_rating: -1, total_rates: -1 };
    case "newest":
    default:           return { createdAt: -1 };
  }
}

const getStoreProducts = async (req, res) => {
  try {
    const storeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store id",
      });
    }

    const { search, category, status, sortBy = "newest" } = req.query;

    // ─── Build the filter ────────────────────────────────────
    const filter = { owner_store_id: storeId };

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      const re = { $regex: escaped, $options: "i" };
      filter.$or = [
        { name: re },
        { description: re },
        { ingredients: re },
      ];
    }

    // Category filter
    if (category && category !== "all" && mongoose.Types.ObjectId.isValid(category)) {
      filter.category_id = category;
    }

    // Status filter
    if (status && status !== "all") {
      switch (status) {
        case "active":
          filter.is_active = { $ne: false };
          break;
        case "inactive":
          filter.is_active = false;
          break;
        case "low":
          filter.is_active = { $ne: false };
          filter.stock = { $gt: 0, $lt: 5 };
          break;
        case "out":
          filter.stock = { $lte: 0 };
          break;
        default:
          break;
      }
    }

    // ─── Query ───────────────────────────────────────────────
    const sort = buildSort(sortBy);

    const products = await Product.find(filter)
      .populate({
        path: "category_id",
        select: "_id name icon description",
      })
      .sort(sort)
      .select(
        "name description price images average_rating total_rates stock skinType ingredients is_active createdAt",
      )
      .lean();

    const store = await storeOwnerModel
      .findById(storeId)
      .select(
        "store_name total_products average_rating total_rates total-orders logo",
      )
      .lean();

    res.status(200).json({
      success: true,
      results: products.length,
      filters: {
        search: search || null,
        category: category || null,
        status: status || null,
        sortBy,
      },
      data: { store, products },
    });
  } catch (error) {
    console.error("getStoreProducts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = getStoreProducts;