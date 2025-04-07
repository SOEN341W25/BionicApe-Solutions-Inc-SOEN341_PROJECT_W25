const User = require('../model/User');

// Check if user is logged in
function isLoggedIn(req, res, next) {
    if (req.session.user) {
        req.user = req.session.user;
        return next();
    }
    
    if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    res.redirect("/login");
}

// Check if user is an admin
async function isAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    
    try {
        const user = await User.findOne({ username: req.session.user });
        
        if (!user) {
            return res.redirect("/login");
        }
        
        if (user.role === "Admin") {
            return next();
        }
        
        res.redirect("/channels");
    } catch (error) {
        console.error("Admin check error:", error);
        res.redirect("/login");
    }
}

// Helper function to check admin status
async function isAdminCheck(username) {
    try {
        const user = await User.findOne({ username });
        return user && user.role === "Admin";
    } catch (error) {
        console.error("Admin check error:", error);
        return false;
    }
}

module.exports = { isLoggedIn, isAdmin, isAdminCheck };
