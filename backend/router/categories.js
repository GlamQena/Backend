const express= require("express");
const checkAuth= require("../middleware/checkAuth");
const checkRole = require("../middleware/checkRole");
const checkAdminPermissions = require("../middleware/checkAdminPermissions");

const getCategoriesController= require("../controllers/categories/getCategories");
const addCategoryController= require("../controllers/categories/addCategory");
const editCategoryById = require("../controllers/categories/editCategory");
const deleteCategoryById = require("../controllers/categories/deleteCategory");

const router= express.Router();

router.use(checkAuth());
router.use(checkRole("admin"));
router.use(checkAdminPermissions(["manageCategories"]));

router.get("/", getCategoriesController);
router.post("/", addCategoryController);
router.put("/:id", editCategoryById);
router.delete("/:id", deleteCategoryById);
module.exports= router;