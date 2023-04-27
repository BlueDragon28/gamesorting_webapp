const wrapAsync = require("../errors/wrapAsync");
const { User } = require("../../models/users");

module.exports = wrapAsync(async function(req, res, next) {
    if (!req.session.user || !req.session.user.id) {
        res.locals.isUserAdmin = false;
        return next();
    }

    const user = await User.findByID(req.session.user.id);

    if (!user) {
        res.locals.isUserAdmin = false;
        return next();
    }

    res.locals.isUserAdmin = user.isAdmin === true ? true : false;
    next();
});