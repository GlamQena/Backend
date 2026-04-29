const {storeOwnerModel} = require('../../models/users/storeOwner');

const getStoresController= async(req, res)=> {
    try {
      const stores = await storeOwnerModel.find()
      .select('image store_name store_description average_rating total_products total_rates');

      if(stores.length === 0)
        return res.status(404).json({success: false, results:0, message: "no stores available to show"});

      res.status(200).json({
      success: true,
      results: stores.length,
      data: stores
    });

  } catch (error) {
    console.error("getStores error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

module.exports= getStoresController;