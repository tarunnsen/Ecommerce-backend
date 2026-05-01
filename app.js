const express = require("express");
const session = require("express-session");
const path = require("path");
const passport = require("passport");
const dotenv = require("dotenv");
const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const MongoStore = require("connect-mongo");

dotenv.config();

require("./config/db");
require("./config/google_auth");

const app = express();

// ✅ Trust proxy — SABSE PEHLE (Render ke liye zaroori)
app.set("trust proxy", 1);

// ======================
// 🔧 GLOBAL MIDDLEWARES
// ======================

app.use(compression());

// ✅ CORS — React frontend ke liye (credentials + multiple origins)
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://ecommerce-frontend-three-beta.vercel.app",
        "https://ecommerce-frontend-git-main-tarunsenwork-9883s-projects.vercel.app",
        "https://ecommerce-frontend-raeil1ker-tarunsenwork-9883s-projects.vercel.app",
      ];
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed — " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ OPTIONS preflight — CORS ke baad, session se PEHLE
app.options("*", cors());

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// Static files
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ FIX 1: cookieParser HATAYA — express-session khud cookie read karta hai
//    cookieParser + express-session saath mein cookie conflict karte hain
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 🔐 SESSION CONFIG
// ======================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ Render reverse proxy ke liye zaroori
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60, // 1 din = 86400 seconds
      autoRemove: "native",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",   // HTTPS pe true
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-domain ke liye "none"
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ======================
// 🔑 PASSPORT
// ======================

app.use(passport.initialize());
app.use(passport.session());

// ======================
// 🔁 AUTH MIDDLEWARE — FIX 2: /cart/auth-check ko block mat karo
// ======================

app.use((req, res, next) => {
  const isStaticFile = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/);

  // ✅ Yeh routes publicly accessible hone chahiye — inhe 401 mat do
  const publicPaths = [
    "/cart/auth-check", // ← SABSE ZAROORI: frontend isse login check karta hai
    "/auth",            // Google OAuth routes
    "/login",
    "/product",         // Products publicly visible hone chahiye
    "/order",
  ];

  const isPublic = publicPaths.some((p) => req.path.startsWith(p));

  const needsAuthRoute =
    req.path.startsWith("/cart") ||
    req.path.startsWith("/checkout");

  if (!req.user && needsAuthRoute && !isStaticFile && !isPublic) {
    return res.status(401).json({
      success: false,
      message: "Login required",
      redirect: "/login",
    });
  }

  next();
});

// ======================
//  ROUTES
// ======================

app.use("/", require("./routes"));
app.use("/cart", require("./routes/cart"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/product", require("./routes/product"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));

// ======================
//  DEBUG ROUTES (DEV ONLY)
// ======================

if (process.env.NODE_ENV !== "production") {
  const expressListRoutes = require("express-list-routes");
  expressListRoutes(app);
}

// ======================
//  GLOBAL ERROR HANDLER
// ======================

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// ======================
//  SERVER START
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});