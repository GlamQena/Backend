const { storeOwnerModel } = require("../../models/users/storeOwner");
const { adminModel } = require("../../models/users/admin");

const approveRegistration = async (req, res) => {
  try {
    // Check if requesting admin has manageStores permission
    const requestingAdmin = await adminModel.findById(req.user.id);

    if (!requestingAdmin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found or unauthorized.",
      });
    }

    if (!requestingAdmin.permission.includes("manageStores")) {
      return res.status(403).json({
        success: false,
        message: "You do not have manageStores permission. Cannot approve store registration.",
      });
    }

    // Get store ID from request parameters
    const storeId = req.params.id;

    // Validate store ID
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required.",
      });
    }

    // Find the store to approve
    const storeToApprove = await storeOwnerModel.findById(storeId);

    // Check if store exists
    if (!storeToApprove) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    // Check if store is already approved
    if (storeToApprove.is_approved) {
      return res.status(400).json({
        success: false,
        message: "Store registration is already approved.",
      });
    }

    // Check if store is active (not blocked)
    if (!storeToApprove.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve a blocked store. Please unblock the store first.",
      });
    }

    // CHECK IF DATA STORE IS COMPLETED BEFORE APPROVING
    // Validate required store information is complete
    const isDataComplete = getMissingFields(storeToApprove).length===0;

    if (!isDataComplete) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve store registration. Store information is incomplete.",
        details: {
          missingFields: getMissingFields(storeToApprove),
          suggestion: "Please ask the store owner to complete all required information before approval."
        }
      });
    }

    // Approve the store by setting is_approved to true
    storeToApprove.is_approved = true;
    
    // Save the updated store information
    const approvedStore = await storeToApprove.save();

    // Return success response with approved store data
    return res.status(200).json({
      success: true,
      message: "Store registration approved successfully.",
      data: {
        storeId: approvedStore._id,
        storeName: approvedStore.store_name,
        storeEmail: approvedStore.store_email,
        isApproved: approvedStore.is_approved,
      }
    });

  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in approveRegistration:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while approving the store.",
      error: error.message
    });
  }
};



const getMissingFields = (store) => {
  const missingFields = [];
  
  if (!store.store_name || store.store_name.trim().length === 0) {
    missingFields.push("store_name");
  }
  
  if (!store.store_phone || store.store_phone.trim().length === 0) {
    missingFields.push("store_phone");
  }
  
  if (!store.store_email || store.store_email.trim().length === 0) {
    missingFields.push("store_email");
  }
  
  if (!store.store_address || 
      !store.store_address.city || 
      !store.store_address.district || 
      !store.store_address.street) {
    missingFields.push("store_address (city, district, street)");
  }
   
  return missingFields;
};

module.exports = approveRegistration;