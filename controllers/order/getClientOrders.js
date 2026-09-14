const mongoose = require("mongoose");
const Order = require("../../models/order");
const { storeOwnerModel } = require("../../models/users/storeOwner.js");

// Escape regex metacharacters so a user typing "a.b" doesn't break the query.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse a user-supplied order-ID search string.
 *
 * Accepts any of:
 *   "GQ-A3F2"    "gq-a3f2"    "#GQ-A3F2"   "#a3f2"   "a3f2"
 *   "GE-A3F2"    "507f1f77bcf86cd799439011"
 *
 * Returns a lowercase hex fragment (or full hex string) to search on,
 * or an empty string if there's nothing usable.
 */
function parseOrderIdInput(raw) {
  if (!raw) return "";

  // 1. Trim and strip a leading "#"
  let value = String(raw).trim().replace(/^#+/, "").trim();

  // 2. Strip the display prefix "GQ-", "GE-", "gq-", "ge-"
  value = value.replace(/^(GQ|GE)[-\s]/i, "").trim();

  // 3. Keep only hex characters (0-9, a-f)
  const hexOnly = value.replace(/[^0-9a-fA-F]/g, "").toLowerCase();

  if (hexOnly.length < 2) return "";

  return hexOnly.slice(0, 24);
}

/**
 * Reshape the $facet output into a plain summary object.
 * Filters out null groups (missing payment.status / status on old docs).
 */
function buildSummary(facetResult) {
  const empty = {
    totalOrders: 0,
    statusCounts: {},
    paymentStatusCounts: {},
  };

  if (!facetResult) return empty;

  const totalOrders = facetResult.totalOrders?.[0]?.count || 0;

  const statusCounts = {};
  for (const row of facetResult.statusCounts || []) {
    if (row._id == null) continue;
    statusCounts[row._id] = row.count;
  }

  const paymentStatusCounts = {};
  for (const row of facetResult.paymentStatusCounts || []) {
    if (row._id == null) continue;
    paymentStatusCounts[row._id] = row.count;
  }

  return { totalOrders, statusCounts, paymentStatusCounts };
}

const getClientOrdersController = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const {
      sortBy = "newest",
      status,
      paymentStatus,
      orderId,
      storeName,
      productName,
    } = req.query;

    const orderFilter = { user_id: userId };

    if (status) orderFilter.status = status;

    if (paymentStatus) orderFilter["payment.status"] = paymentStatus;

    if (orderId && orderId.trim()) {
      const parsed = parseOrderIdInput(orderId);

      if (!parsed) {
        // No usable hex characters -> no possible match, but still return
        // the summary so filter buttons stay populated.
        const summary = await computeSummary(userId);
        return res.status(200).json({
          success: true,
          count: 0,
          summary,
          data: [],
        });
      }

      if (parsed.length === 24 && mongoose.Types.ObjectId.isValid(parsed)) {
        orderFilter._id = new mongoose.Types.ObjectId(parsed);
      } else {
        const escaped = escapeRegex(parsed);
        const matchingIds = await Order.aggregate([
          { $match: { user_id: userId } },
          { $addFields: { _idStr: { $toString: "$_id" } } },
          {
            $match: {
              _idStr: { $regex: `${escaped}$`, $options: "i" },
            },
          },
          { $project: { _id: 1 } },
          { $limit: 500 },
        ]);

        if (matchingIds.length === 0) {
          const summary = await computeSummary(userId);
          return res.status(200).json({
            success: true,
            count: 0,
            summary,
            data: [],
          });
        }

        orderFilter._id = { $in: matchingIds.map((o) => o._id) };
      }
    }

    // -------------------------------------------------------------
    // Filter: store name (two-step: find matching stores, filter orders)
    // -------------------------------------------------------------
    if (storeName && storeName.trim()) {
      const escaped = escapeRegex(storeName.trim());
      const matchingStores = await storeOwnerModel
        .find({ store_name: { $regex: escaped, $options: "i" } })
        .select("_id")
        .lean();

      if (matchingStores.length === 0) {
        const summary = await computeSummary(userId);
        return res.status(200).json({
          success: true,
          count: 0,
          summary,
          data: [],
        });
      }

      orderFilter["products.owner_store_id"] = {
        $in: matchingStores.map((s) => s._id),
      };
    }

    // -------------------------------------------------------------
    // Filter: product name (regex on the order's product snapshot)
    // -------------------------------------------------------------
    if (productName && productName.trim()) {
      const escaped = escapeRegex(productName.trim());
      orderFilter["products.products.name"] = {
        $regex: escaped,
        $options: "i",
      };
    }

    // -------------------------------------------------------------
    // Sort
    // -------------------------------------------------------------
    let sort = { createdAt: -1 };
    switch (sortBy) {
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "price_high":
        sort = { total_price: -1 };
        break;
      case "price_low":
        sort = { total_price: 1 };
        break;
      case "newest":
      default:
        sort = { createdAt: -1 };
        break;
    }

    // -------------------------------------------------------------
    // Fetch the filtered list + the summary in parallel.
    // They are independent queries — no reason to serialise them.
    // -------------------------------------------------------------
    const [orders, summary] = await Promise.all([
      Order.find(orderFilter)
        .sort(sort)
        .populate({
          path: "products.owner_store_id",
          select: "store_name logo",
        })
        .populate({
          path: "products.products.prod_id",
          select: "name price stock images hasReviewed",
        })
        .populate(
          "user_id",
          "avatar firstName lastName email phoneNumber address"
        )
        .lean(),
      computeSummary(userId),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      summary,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

async function computeSummary(userId) {
  const [facetResult] = await Order.aggregate([
    { $match: { user_id: userId } },
    {
      $facet: {
        totalOrders: [{ $count: "count" }],
        statusCounts: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        paymentStatusCounts: [
          { $group: { _id: "$payment.status", count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  return buildSummary(facetResult);
}

module.exports = getClientOrdersController;