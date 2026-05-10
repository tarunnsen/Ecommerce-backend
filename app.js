const express = require("express");
const session = require("express-session");
const path = require("path");
const passport = require("passport");
const dotenv = require("dotenv");
const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const { MongoStore } = require("connect-mongo");

dotenv.config();

require("./config/db");
require("./config/google_auth");

const app = express();

app.set("trust proxy", 1);

app.use(compression());

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://ecommerce-frontend-three-beta.vercel.app",
        "https://ecommerce-frontend-git-main-tarunsenwork-9883s-projects.vercel.app",
        "https://ecommerce-frontend-raeil1ker-tarunsenwork-9883s-projects.vercel.app",
      ];
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed — " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60,
      autoRemove: "native",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", require("./routes"));
app.use("/cart", require("./routes/cart"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/product", require("./routes/product"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));

if (process.env.NODE_ENV !== "production") {
  const expressListRoutes = require("express-list-routes");
  expressListRoutes(app);
}

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});