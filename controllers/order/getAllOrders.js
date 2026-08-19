const Order = require("../../models/order");
const mongoose = require("mongoose");

const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      status = null,
      client_id = null,
    } = req.query;

    // 1. validate page
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ success: false, message: "Invalid page parameter. Page must be a positive integer" });
    }

    // 2. validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ success: false, message: "Invalid limit parameter. Limit must be between 1 and 100" });
    }

    // 3. validate sortBy
    const allowedSortFields = ["createdAt", "updatedAt", "total_price", "status"];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ success: false, message: `Invalid sortBy field. Allowed values: ${allowedSortFields.join(", ")}` });
    }

    // 4. validate sortOrder
    if (!sortOrder || typeof sortOrder !== "string" || (!sortOrder.startsWith("asc") && !sortOrder.startsWith("desc"))) {
      return res.status(400).json({ success: false, message: "Invalid sortOrder. Must be 'asc' or 'desc'" });
    }
    const sortOrderValue = sortOrder.startsWith("asc") ? 1 : -1;

    // 5. validate status
    const allowedStatuses = ["قيد الانتظار", "جاري التجهيز", "جاهز للتوصيل", "قيد التوصيل", "ملغي", "تم التوصيل"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}` });
    }

    // 6. validate client_id
    if (client_id && !mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ success: false, message: "Invalid client_id" });
    }

    const matchQuery = {};
    if (status) matchQuery.status = status;
    if (client_id) matchQuery.user_id = new mongoose.Types.ObjectId(client_id);

    const skip = (pageNum - 1) * limitNum;

    // 7. Build the aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users", 
          localField: "user_id",
          foreignField: "_id",
          as: "user_id",
        },
      },
      { $unwind: "$user_id" },
    ];

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const orConditions = [
        { "user_id.firstName": searchRegex },
        { "user_id.lastName": searchRegex },
        { "user_id.phoneNumber": searchRegex },
      ];
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(search.trim()) }); // يسمحلك تدور برقم الأوردر
      }
      pipeline.push({ $match: { $or: orConditions } });
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: { [sortBy]: sortOrderValue } },
          { $skip: skip },
          { $limit: limitNum },
          { $project: { "user_id.password": 0 } },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await Order.aggregate(pipeline);
    let orders = result[0].data;
    const totalCount = result[0].totalCount[0]?.count || 0;

    // populate the owner_store_id for each product in the orders
    orders = await Order.populate(orders, {
      path: "products.owner_store_id",
      select: "store_name",
    });

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasMore = pageNum < totalPages;

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore,
        nextPage: hasMore ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
      },
      appliedFilters: {
        search: search || null,
        status: status || null,
        client_id: client_id || null,
        sortBy,
        sortOrder: sortOrderValue === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = getAllOrders;