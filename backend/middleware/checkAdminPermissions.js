//TODO =>
//check if the user who sent the request (req.user.id) model permission list has at least one of the allowedPermission which passed as a parameter to this function which at last return middleware (req, res, next)
//   "manageUsers", //clients
//   "manageAdmins",
//   "viewAnalytics",
//   "manageStores",
//   "manageOrders",
//   "manageCategories",
//if true go to the next basic endpoint [next()] else return error response