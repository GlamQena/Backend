const checkRole = (allowedRole) => {

    return async(req, res, next) => {
        const userRole = req.user.role;

        if(Array.isArray(allowedRole) && !allowedRole.includes(userRole))
            return res.status(403).json({message: `you're not authorized`});

        // if( userRole !== allowedRole)
        //     return res.status(403).json({message: `only ${allowedRole} is allowed`});

        next();
    }
}

module.exports= checkRole;