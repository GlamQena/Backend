const express= require("express");
const checkAuth= require("../middleware/checkAuth");
const getCategoriesController= require("../controllers/categories/getCategories");
const addCategoryController= require("../controllers/categories/addCategory");

const router= express.Router();
router.use(checkAuth);
router.get("/", getCategoriesController);
router.post("/", addCategoryController);

module.exports= router;