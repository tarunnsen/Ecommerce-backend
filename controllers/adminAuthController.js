const { adminModel } = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ✅ Admin create karo (one-time setup)
exports.createAdmin = async (req, res) => {
  try {
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash("Tamonika@2580", salt);

    let user = new adminModel({
      name: "Tarun",
      email: "Techfocus@gmail.com",
      password: hash,
      role: "admin",
    });

    await user.save();

    res.json({ success: true, message: "Admin created successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Login page — React handle karega
exports.loginPage = (req, res) => {
  res.redirect(`${FRONTEND_URL}/admin/login`);
};

// ✅ Login — token response mein bhejo
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminModel.findOne({ email });
    if (!admin) return res.status(404).json({
      success: false, message: "Admin not found"
    });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({
      success: false, message: "Invalid password"
    });

    const token = jwt.sign(
      { email: admin.email, admin: true },
      process.env.JWT_KEY,
      { expiresIn: '24h' }
    );

    // ✅ Token JSON mein bhejo — React localStorage mein save karega
    res.json({
      success: true,
      message: "Login successful",
      token
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Logout
exports.logoutAdmin = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

// ✅ Dashboard
exports.dashboard = (req, res) => {
  res.json({ success: true, message: "Admin dashboard" });
};