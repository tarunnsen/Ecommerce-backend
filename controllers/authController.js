const passport = require("passport");
const jwt = require("jsonwebtoken"); // ✅ add karo

// Start Google OAuth — same rehega
exports.googleAuth = (req, res, next) => {
  const redirectURL = req.query.redirect || "/";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: redirectURL
  })(req, res, next);
};

// Google Callback 
exports.googleCallback = (req, res) => {
  try {
    let redirectURL = req.query.state || "/";
    if (!redirectURL.startsWith("/")) redirectURL = "/";

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const jwt = require("jsonwebtoken");

    const token = jwt.sign(
      {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
      },
      process.env.JWT_KEY, // ✅ JWT_KEY — .env se match
      { expiresIn: "7d" }
    );

    res.redirect(
      `${FRONTEND_URL}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirectURL)}`
    );

  } catch (err) {
    console.error("Redirect error:", err);
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  }
};

// Logout — same rehega
exports.logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) console.error("Session destroy error:", destroyErr);
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      });
      res.status(200).json({ success: true, message: "Logged out" });
    });
  });
};