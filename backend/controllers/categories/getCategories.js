const categoryModel= require("../../models/category");

const getCategoriesController= async (req, res)=>{
    try{
        const categories= await categoryModel.find();

        if(categories.length === 0)
            return res.status(404).json({message: "no categories available to show"});

        res.status(200).json(categories);
        
    }catch(error){
        res.status(500).json({message: "internal server error", error:error.message});
    }
}

module.exports= getCategoriesController;