const categoryModel= require("../../models/category");
const {categorySchema} = require("../../validations/products");

const addCategoryController= async (req, res)=>{
    try{
        const category= {...req.body};
        const parsedCategory= categorySchema.safeParse(category);
        if(!parsedCategory.success)
            return res.status(400).json({message: parsedCategory.error.issues[0].message});

        const existingCategory= await categoryModel.findOne({name: category.name});
        if(existingCategory)
            return res.status(400).json({message: "A category with this name already exist"});

        const newCategory= await categoryModel.create({...parsedCategory.data});

        res.status(200).json({message: "category added successfully", category:newCategory});
        
    }catch(error){
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= addCategoryController;