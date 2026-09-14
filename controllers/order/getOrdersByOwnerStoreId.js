const mongoose = require("mongoose");
const Order = require("../../models/order");
const { clientModel } = require("../../models/users/client.js");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseOrderIdInput(raw) {
  if (!raw) return "";
  let value = String(raw).trim().replace(/^#+/, "").trim();
  value = value.replace(/^(GQ|GE)[-\s]/i, "").trim();
  const hexOnly = value.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  if (hexOnly.length < 2) return "";
  return hexOnly.slice(0, 24);
}

function emptySummary() {
  return {
    totalOrders: 0,
    statusCounts: {},
    paymentStatusCounts: {},
  };
}

function emptyResponse(storeId) {
  return {
    success: true,
    store_id: storeId,
    summary: emptySummary(),
    orders: [],
  };
}

const getOrdersByOwnerStoreId = async (req, res) => {
  try {
    const storeId = req.user.id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    const {
      sortBy = "newest",
      status,
      paymentStatus,
      orderId,
      clientSearch,
      productName,
    } = req.query;

    const orderFilter = { "products.owner_store_id": storeObjectId };

    if (status) {
      orderFilter.status = status;
    }

    if (paymentStatus) {
      orderFilter["payment.status"] = paymentStatus;
    }

    if (orderId && orderId.trim()) {
      const parsed = parseOrderIdInput(orderId);

      if (!parsed) {
        return res.status(200).json(emptyResponse(storeId));
      }

      if (parsed.length === 24 && mongoose.Types.ObjectId.isValid(parsed)) {
        orderFilter._id = new mongoose.Types.ObjectId(parsed);
      } else {
        const escaped = escapeRegex(parsed);
        const matchingIds = await Order.aggregate([
          { $match: { "products.owner_store_id": storeObjectId } },
          { $addFields: { _idStr: { $toString: "$_id" } } },
          { $match: { _idStr: { $regex: `${escaped}$`, $options: "i" } } },
          { $project: { _id: 1 } },
          { $limit: 500 },
        ]);

        if (matchingIds.length === 0) {
          return res.status(200).json(emptyResponse(storeId));
        }

        orderFilter._id = { $in: matchingIds.map((o) => o._id) };
      }
    }

    if (clientSearch && clientSearch.trim()) {
      const raw = clientSearch.trim();
      const escaped = escapeRegex(raw);

      const matchingClients = await clientModel
        .find({
          $or: [
            { firstName: { $regex: escaped, $options: "i" } },
            { lastName: { $regex: escaped, $options: "i" } },
            { username: { $regex: escaped, $options: "i" } },
            { phoneNumber: { $regex: escaped, $options: "i" } },
          ],
        })
        .select("_id")
        .limit(500)
        .lean();

      if (matchingClients.length === 0) {
        return res.status(200).json(emptyResponse(storeId));
      }

      orderFilter.user_id = { $in: matchingClients.map((c) => c._id) };
    }

    if (productName && productName.trim()) {
      const escaped = escapeRegex(productName.trim());
      orderFilter["products.products.name"] = {
        $regex: escaped,
        $options: "i",
      };
    }

    // -------------------------------------------------------------
    // Sorting (price sort uses the whole order total; see note below)
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
    // Status counts + total (over ALL matching orders)
    // -------------------------------------------------------------
    const [countsAgg] = await Order.aggregate([
      { $match: orderFilter },
      {
        $facet: {
          orderStatusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          paymentStatusCounts: [
            { $group: { _id: "$payment.status", count: { $sum: 1 } } },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const statusCounts = {};
    countsAgg.orderStatusCounts.forEach(({ _id, count }) => {
      if (_id) statusCounts[_id] = count;
    });

    const paymentStatusCounts = {};
    countsAgg.paymentStatusCounts.forEach(({ _id, count }) => {
      if (_id) paymentStatusCounts[_id] = count;
    });

    const totalOrders = countsAgg.total[0]?.count || 0;

    const orders = await Order.find(orderFilter)
      .sort(sort)
      .populate(
        "user_id",
        "firstName lastName username email phoneNumber address",
      )
      .populate("products.products.prod_id", "images hasReviewed")
      .lean();

    // -------------------------------------------------------------
    // Shape response: one row per order, only this store's slice
    // -------------------------------------------------------------
    const storeOrders = orders
      .map((order) => {
        const storeData = order.products.find(
          (s) => s.owner_store_id.toString() === storeId.toString(),
        );

        if (!storeData) return null;

        return {
          order_id: order._id,
          order_status: order.status,
          order_date: order.createdAt,
          payment_method: order.payment?.method,
          payment_status: order.payment?.status,

          store_products: storeData.products.map((product) => ({
            product_id: product.prod_id,
            product_name: product.name,
            quantity: product.quantity,
            hasReviewed: product.prod_id?.hasReviewed || false,
            images: product.prod_id?.images || [],
            price_per_unit: product.price,
            subtotal: product.subtotal_price,
          })),

          store_subtotal: storeData.store_subtotal,

          customer: {
            id: order.user_id?._id || order.user_id,
            name: order.user_id?.firstName
              ? `${order.user_id.firstName} ${order.user_id.lastName || ""}`.trim()
              : order.user_id?.username || "",
            email: order.user_id?.email,
            phone: order.user_id?.phoneNumber,
            address: order.user_id?.address
              ? [
                  order.user_id.address.street,
                  order.user_id.address.district,
                  order.user_id.address.city,
                ]
                  .filter(Boolean)
                  .join("، ")
              : "",
          },

          store_payout:
            order.profit_breakdown?.stores_payout?.find(
              (p) => p.owner_store_id.toString() === storeId,
            )?.amount || 0,

          delivery_cost: order.delivery_cost,

          order_created_at: order.createdAt,
          order_updated_at: order.updatedAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      store_id: storeId,
      summary: {
        totalOrders,
        statusCounts,
        paymentStatusCounts,
      },
      orders: storeOrders,
    });
  } catch (error) {
    console.error("Error in getOrdersByOwnerStoreId:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = getOrdersByOwnerStoreId;