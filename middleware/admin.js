const jwt = require("jsonwebtoken");
require("dotenv").config();

async function validateAdmin(req, res, next) {
    try {
        // ✅ Pehle header check karo, phir cookie
        let token = req.headers['authorization']?.split(' ')[1]
            || req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Login required"
            });
        }

        let data = jwt.verify(token, process.env.JWT_KEY);
        req.user = data;
        next();

    } catch (err) {
        console.error("Admin Auth Error:", err);
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
}


// 🔐 Check if user logged in
async function userIsLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }

    try {

        const redirectURL = req.originalUrl;

        req.session.returnTo = redirectURL;

        console.log(`🔹 Saved redirect URL in session: ${redirectURL}`);

    } catch (err) {

        console.error("Session redirect error:", err);

    }

    return res.redirect("/users/signin");

}

module.exports = { validateAdmin, userIsLoggedIn };