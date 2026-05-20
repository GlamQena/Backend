
const ActivationFactory = (activableEntities) => {

    const activation = async (req, res) => {
        try {

            const { id, entity } = req.params; //Target model document
            const { activate } = req.query;

            if(!activableEntities[entity])
                return res.status(400).json({message: `entity ${entity} isn't activable`});

            let {model, modelName, allowedRoles} = activableEntities[entity];
            allowedRoles = typeof allowedRoles === "string" ? [allowedRoles] : allowedRoles;

            if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `access denied, ${allowedRoles.join(", ")} only`
                });
            }
            
            if (activate === undefined) {
                return res.status(400).json({
                    message: "activate query parameter is required"
                });
            }

            if (activate !== "true" && activate !== "false") {
                return res.status(400).json({
                    message: "activate must be true or false"
                });
            }
            // convert string to boolean
            const activateStatus = activate === "true";

            const modelObject = await model.findById(id)
            .select("-password")

            // check if modelObject exists
            if (!modelObject) {
                return res.status(404).json({
                    message: `${modelName} not found`
                });
            }

            const selfActivationForbidden = ["user", "admin", "client", "store_owner"];

            // prevent user/admin from activating or deactivating themselves
            if (selfActivationForbidden.includes(modelName) && req.user.id === id) {
                return res.status(403).json({
                    message: "you cannot change your own activation status"
                });
            }


            // prevent unnecessary update
            if (modelObject.isActive === activateStatus) {
                return res.status(400).json({
                    message: `${modelName} already ${activateStatus ? "active" : "deactivated"}`
                });
            }

            modelObject.isActive = activateStatus;

            await modelObject.save();

            return res.status(200).json({
                message: `${modelName} ${activateStatus ? "activated" : "deactivated"} successfully`,
                [modelName]: modelObject
            });

        } catch (err) {
            return res.status(500).json({
                message: err.message
            });
        }
    };

    return activation;
}

module.exports = ActivationFactory;
