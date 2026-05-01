const { productModel } = require("../models/product");
const { cartModel } = require("../models/cart");

exports.checkoutPage = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Login required",
      redirect: "/login"
    });
  }

  try {
    let product = null;
    let cart = null;

    // ✅ FIX — pehle check karo "cart" string hai ya real product ID
    const paramId = req.params.id;
    const isCartCheckout = paramId === "cart";

    if (!isCartCheckout) {
      // Buy Now flow — valid MongoDB ID hai toh hi findById karo
      product = await productModel.findById(paramId).lean();
    }

    if (product) {
      // Buy Now — single product ko cart ki tarah treat karo
      cart = {
        products: [{ productId: product, quantity: 1 }]
      };
    } else {
      // Cart checkout flow
      cart = await cartModel
        .findOne({ user: req.session?.passport?.user })
        .populate("products.productId")
        .lean();

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found"
        });
      }
    }

    res.json({
      success: true,
      data: {
        product,
        user: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || ""
        },
        cart
      }
    });

  } catch (error) {
    console.error("Checkout Error:", error?.message || error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};