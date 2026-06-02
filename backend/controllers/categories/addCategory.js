const categoryModel= require("../../models/category");
const { adminModel } = require("../../models/users/admin");
const auditLogModel = require("../../models/users/adminAuditLog");
const {addCategorySchema} = require("../../validations/products");

const addCategoryController= async (req, res)=>{
    try{
        const requestingUserId = req.user.id;
        const {name, icon, description}= {...req.body};

        //apply zod validations
        const parsedCategory= addCategorySchema.safeParse({name, icon, description});
        if(!parsedCategory.success)
            return res.status(400).json({message: parsedCategory.error.issues[0].message});

        const existingCategory= await categoryModel.findOne({name: parsedCategory.data.name});
        if(existingCategory)
            return res.status(400).json({message: "A category with this name already exist"});

        const newCategory= await categoryModel.create({...parsedCategory.data});

        //save operation log
        await adminModel.findByIdAndUpdate(requestingUserId, {$set: {lastActivity: new Date()}, $inc: {totalOperations: 1}});
        const operationLog = await auditLogModel.create({admin_id: requestingUserId, operation: "addCategory", entityModel: "category", entityId: newCategory._id, operationGroup: "CREATE"});
        
        res.status(200).json({
            message: "category added successfully", 
            data:newCategory,
            operationLog: operationLog.toObject()
        });
        
    }catch(error){
        // Handle mongoose validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: errors,
            });
            }
        
        console.log("Error adding category:", error);
        res.status(500).json({message: "internal server error", error: error.message});
    }
}

module.exports= addCategoryController;