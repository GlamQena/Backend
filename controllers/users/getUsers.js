const userModel = require("../../models/users/user");
const {adminModel} = require("../../models/users/admin");

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      isActive = null,
      role = null,
    } = req.query;

    if (isNaN(parseInt(page)) || parseInt(page) < 1) {
      return res.status(400).json({ success: false, message: "Page number must be valid number greater than 0!" });
    }

    if (parseInt(limit) < 1 || parseInt(limit) > 100) {
      return res.status(400).json({ success: false, message: "Limit must be between 1 and 100!" });
    }

    const sortOptions = ["createdAt", "updatedAt", "name", "isActive"];
    if (!sortOptions.includes(sortBy)) {
      return res.status(400).json({ success: false, message: `Invalid sortBy field! Allowed fields: ${sortOptions.join(", ")}` });
    }

    const sortOrderNum = sortOrder.startsWith("asc") ? 1 : sortOrder.startsWith("desc") ? -1 : null;
    if (!sortOrderNum) {
      return res.status(400).json({ success: false, message: "Invalid sortOrder! Must be 'asc' or 'desc'." });
    }

    if (role && !["client", "store_owner", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role! Allowed roles: client, store_owner, admin." });
    }

    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== null) {
      query.isActive = isActive === "true";
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
      if (role === "store_owner") {
        query.$or.push({ store_name: searchRegex });
      }
    }

    // Get all matching users
    let allUsers = await userModel.find(query)
      .select("-password")
      .sort({ [sortBy]: sortOrderNum })
      .lean();

    //TODO => check admin permissions to manage users on filtering
    const requestingAdmin = await adminModel.findById(req.user.id);

    // Filter users based on hierarchy
    let filteredUsers = allUsers.filter(user => {
      if (user.role === "admin" && requestingAdmin.permission.includes("manageAdmins")) {
        // Show admins created by this admin
        if (user.createdBy?.toString() === req.user.id) {
          return true;
        }

        if(user._id === req.user.id)
          return false;
        
        // Show self-registered admins (createdBy === null) ONLY when viewing deletion requests
        if (user.createdBy === null) {
          return true;
        }
        
        // Hide all other admins
        return false;
      }
      
      if(user.role === "store_owner" && requestingAdmin.permission.includes("manageStores"))
        return true;

      if(user.role === "client" && requestingAdmin.permission.includes("manageUsers"))
        return true;

      return false;
    });

    // Separate pending deletion requests
    const deletionRequestingUsers = filteredUsers.filter(user => 
      user.deletion_requested === true && user.deletion_status === "pending"
    );

    // Pending registration requests (only store owners)
    const registrationRequestingUsers = filteredUsers.filter(user => 
      user.role === "store_owner" && user.is_approved === false
    );

    filteredUsers = filteredUsers.filter(user => user.createdBy !== null);

    // Apply pagination AFTER filtering
    const skip = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    const paginatedUsers = filteredUsers.slice(skip, skip + limitNum);
    const totalCount = filteredUsers.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasMore = skip + limitNum < totalCount;

    res.status(200).json({
      success: true,
      count: paginatedUsers.length,
      data: {
        users: paginatedUsers,
        pendingRegRequests: registrationRequestingUsers.slice(skip, skip + limitNum),
        pendingDeletionRequests: deletionRequestingUsers.slice(skip, skip + limitNum),
      },
      pagination: {
        currentPage: parseInt(page),
        nextPage: parseInt(page) + 1 <= totalPages ? parseInt(page) + 1 : null,
        prevPage: parseInt(page) - 1 > 0 ? parseInt(page) - 1 : null,
        limitPerPage: limitNum,
        totalCount,
        totalPages,
        hasMore,
      },
      appliedFilters: {
        search: search || null,
        isActive: isActive !== null ? isActive === "true" : null,
        role: role || null,
        sortBy,
        sortOrder,
      }
    });

  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = getUsers;