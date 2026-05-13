const express= require("express");
const checkAuth= require("../middleware/checkAuth");
const getCategoriesController= require("../controllers/categories/getCategories");
const addCategoryController= require("../controllers/categories/addCategory");
const checkRole = require("../middleware/checkRole");
const editCategoryById = require("../controllers/categories/editCategory");
const deleteCategoryById = require("../controllers/categories/deleteCategory");

const router= express.Router();

router.use(checkAuth());
router.get("/", getCategoriesController);

router.post("/", checkRole("admin"), addCategoryController);
router.put("/:id",checkRole("admin"),editCategoryById)
router.delete("/:id",checkRole("admin"),deleteCategoryById)
module.exports= router;