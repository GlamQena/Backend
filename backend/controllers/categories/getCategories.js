const categoryModel = require("../../models/category");

const getCategoriesController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      isActive = null,
    } = req.query;

    // 1. Validate and parse page
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page parameter. Page must be a positive integer"
      });
    }

    // 2. Validate and parse limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit parameter. Limit must be between 1 and 100"
      });
    }

    // 3. Validate sortBy (prevent NoSQL injection)
    const allowedSortFields = ["name", "createdAt", "updatedAt", "totalProducts", "isActive"];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy field. Allowed values: ${allowedSortFields.join(", ")}`
      });
    }

    // 4. Validate sortOrder (ENHANCED)
    if (!sortOrder || (typeof sortOrder !== "string") || (!sortOrder.startsWith("asc") && !sortOrder.startsWith("desc"))) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortOrder. Must be 'asc' or 'desc'"
      });
    }

    const matchQuery = {};
    const skip = (pageNum - 1) * limitNum;

    // Add search with OR condition
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      matchQuery.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // Add isActive filter
    if (isActive !== null && isActive !== undefined) {
      matchQuery.isActive = isActive === "true";
    }

    // Set sort order
    const sortOrderValue = sortOrder.startsWith("asc") ? 1 : -1;

    const currentDate = new Date();
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth()-1 , 1);

    // ============= EXECUTE QUERIES IN PARALLEL FOR PERFORMANCE =============
    const [categories, totalCount, categoriesStats] = await Promise.all([
      // Get paginated categories
      categoryModel
        .find(matchQuery)
        .sort({ [sortBy]: sortOrderValue })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      
      // Get total count for pagination
      categoryModel.countDocuments(matchQuery),

      // Get statistics
      categoryModel.aggregate([
        {
            $match: matchQuery
        },
        {
            $lookup:{
                localField: "_id",
                from: "products",
                foreignField: "category_id",
                as: "products",
            }
        },
        {
            $unwind: {path: "$products", preserveNullAndEmptyArrays: true}
        },
        {
          $group: {
            _id: null,
            totalCategories: { $sum: 1 },
            activeCategories: { $sum: { $cond: ["$isActive", 1, 0] } },
            totalProducts: { $sum: "$totalProducts" },
            recentlyAddedCategories: {$sum: {$cond: [{$gte: ["$createdAt", lastMonthStart]}, 1, 0]}},
            recentlyAddedProducts: {$sum: {$cond: [{$gte: ["$products.createdAt", lastMonthStart]}, 1, 0]}},
          }
        },
        {
          $project: {
            _id: 0,
            totalCategories: 1,
            activeCategories: 1,
            totalProducts: 1,
            recentlyAddedCategories: 1,
            recentlyAddedProducts: 1,
          }
        }
      ]),
    ]);

    // Handle empty categories
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories available to show",
        data: {
          categories: [],
          categoriesStats: {
            totalCategories: 0,
            activeCategories: 0,
            inactiveCategories: 0,
            totalProducts: 0,
            recentlyAddedCategories: 0,
            recentlyAddedProducts: 0
          }
        },
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalCount: 0,
          totalPages: 0,
          hasMore: false
        }
      });
    }

    // Process statistics with null checks and percentage safety (ENHANCED)
    let stats = {
      totalCategories: 0,
      activeCategories: 0,
      inactiveCategories: 0,
      totalProducts: 0,
      recentlyAddedCategories: 0,
      recentlyAddedProducts: 0,
      activeCategoriesPercentage: 0,
      inactiveCategoriesPercentage: 0,
    };

    // Add null check for categoriesStats array and its elements
    if (categoriesStats && categoriesStats.length > 0 && categoriesStats[0]) {
      const totalCats = categoriesStats[0].totalCategories || 0;
      const activeCats = categoriesStats[0].activeCategories || 0;
      
      stats = {
        totalCategories: totalCats,
        activeCategories: activeCats,
        inactiveCategories: (totalCats - activeCats) || 0,
        totalProducts: categoriesStats[0].totalProducts || 0,
        recentlyAddedCategories: categoriesStats[0].recentlyAddedCategories || 0,
        recentlyAddedProducts: categoriesStats[0].recentlyAddedProducts || 0,
        // Percentage calculation safety (prevent division by zero)
        activeCategoriesPercentage: totalCats > 0 ? parseFloat(((activeCats / totalCats) * 100).toFixed(2)) : 0,
        inactiveCategoriesPercentage: totalCats > 0 ? parseFloat((((totalCats - activeCats) / totalCats) * 100).toFixed(2)) : 0,
      };
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasMore = pageNum < totalPages;

    // Success response
    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: {
        categories,
        categoriesStats: stats
      },
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore,
        nextPage: hasMore ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      },
      appliedFilters: {
        search: search || null,
        isActive: isActive !== null ? (isActive === "true") : null,
        sortBy,
        sortOrder: sortOrderValue === 1 ? "asc" : "desc"
      }
    });
    
  } catch (error) {
    console.error("Error in getCategoriesController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = getCategoriesController;