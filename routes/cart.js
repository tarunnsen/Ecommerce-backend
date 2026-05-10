const express = require("express");
const router = express.Router();
const { validateUser } = require("../middleware/userAuth");

const {
  getCart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  authCheck,
} = require("../controllers/cartController");

router.get("/auth-check", authCheck);
router.get("/", validateUser, getCart);
router.post("/add/:id", validateUser, addToCart);
router.patch("/decrease/:id", validateUser, decreaseQuantity);
router.delete("/remove/:id", validateUser, removeFromCart);

module.exports = router;