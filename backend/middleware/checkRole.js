const checkRole = (allowedRole) => {
    return async(req, res, next) => {
        const userRole = req.user.role;
        
        // Convert to array for consistent handling
        const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
        
        if (!allowedRoles.includes(userRole)) {

            const msgAllowedRoles = allowedRoles.length > 1 
                ? allowedRoles.join(', ') 
                : allowedRole;
            return res.status(403).json({ 
                message: `only ${msgAllowedRoles} is allowed` 
            });
        }
        
        next();
    }
}

module.exports= checkRole;