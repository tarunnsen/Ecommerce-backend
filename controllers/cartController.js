const { cartModel } = require("../models/cart");
const { productModel } = require("../models/product");
const jwt = require("jsonwebtoken");

const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.session?.passport?.user;
};

exports.authCheck = (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_KEY);
      return res.json({ authenticated: true });
    } catch (err) {
      // fall through to session check
    }
  }

  res.json({ authenticated: req.isAuthenticated() });
};

exports.getCart = async (req, res) => {
  try {
    const userId = getUserId(req);

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("products.productId");

    if (!cart) {
      return res.json({ success: true, data: { products: [], total: 0 } });
    }

    const total = cart.products.reduce((sum, item) => {
      const price = item.productId?.discountPrice || item.productId?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: { _id: cart._id, products: cart.products, total },
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required",
        redirect: "/login",
      });
    }

    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      cart = new cartModel({
        user: userId,
        products: [{ productId: product._id, quantity: 1 }],
      });
    } else {
      const existingProduct = cart.products.find(
        (p) => p.productId.toString() === product._id.toString()
      );
      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.products.push({ productId: product._id, quantity: 1 });
      }
    }

    await cart.save();
    res.json({ success: true, message: "Product added to cart" });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.decreaseQuantity = async (req, res) => {
  try {
    const userId = getUserId(req);

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const index = cart.products.findIndex(
      (p) => p.productId.toString() === req.params.id
    );

    if (index > -1) {
      if (cart.products[index].quantity > 1) {
        cart.products[index].quantity -= 1;
      } else {
        cart.products.splice(index, 1);
      }
    }

    await cart.save();

    const updatedCart = await cartModel
      .findOne({ user: userId })
      .populate("products.productId");

    const total = updatedCart.products.reduce((sum, item) => {
      const price = item.productId?.discountPrice || item.productId?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: { _id: updatedCart._id, products: updatedCart.products, total },
    });
  } catch (err) {
    console.error("Decrease quantity error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = getUserId(req);

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.products = cart.products.filter(
      (p) => p.productId.toString() !== req.params.id
    );

    await cart.save();

    const updatedCart = await cartModel
      .findOne({ user: userId })
      .populate("products.productId");

    const total = updatedCart.products.reduce((sum, item) => {
      const price = item.productId?.discountPrice || item.productId?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: { _id: updatedCart._id, products: updatedCart.products, total },
    });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};