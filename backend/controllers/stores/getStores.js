const Store = require('../../models/users/storeOwner');

const getStoresController= async(req, res)=> {
    try {
    const stores = await Store.find()
      .select('store_name store_description');

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