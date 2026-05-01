const passport = require("passport");

// Start Google OAuth
exports.googleAuth = (req, res, next) => {
  const redirectURL = req.query.redirect || "/";

  console.log("🔁 Passing redirect in OAuth state:", redirectURL);

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

    // 🔒 Security check
    if (!redirectURL.startsWith("/")) {
      redirectURL = "/";
    }

    // ✅ React frontend pe redirect karo — backend pe nahi
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

    console.log("✅ Redirecting user to React:", FRONTEND_URL + redirectURL);

    res.redirect(FRONTEND_URL + redirectURL);

  } catch (err) {
    console.error("Redirect error:", err);
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  }
};

// Logout
exports.logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);

      return res.status(500).json({ success: false, message: "Logout failed" });
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("Session destroy error:", destroyErr);
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      });
      res.status(200).json({ success: true, message: "Logged out" });
    });
  });
};