const jwt = require("jsonwebtoken");

async function validateUser(req, res, next) {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (token) {
      const data = jwt.verify(token, process.env.JWT_KEY); // ✅ JWT_KEY
      req.user = data;
      return next();
    }

    if (req.isAuthenticated()) {
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Login required"
    });

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
}

module.exports = { validateUser };