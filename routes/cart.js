const express = require("express");
const router = express.Router();
const { validateUser } = require("../middleware/userAuth"); // ✅ import

const {
  getCart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  authCheck
} = require("../controllers/cartController");

router.get("/auth-check", authCheck);
router.get("/", validateUser, getCart);          
router.get("/add/:id", validateUser, addToCart);  
router.get("/decrease/:id", validateUser, decreaseQuantity); 
router.get("/remove/:id", validateUser, removeFromCart);     

module.exports = router;