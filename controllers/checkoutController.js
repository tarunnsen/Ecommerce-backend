const { productModel } = require("../models/product");
const { cartModel } = require("../models/cart");

// ✅ Helper — JWT ya session dono se userId nikalo
const getUserId = (req) => {
  return req.user?.id          // JWT token se (mobile)
    || req.user?._id           // JWT token se (alternate)
    || req.session?.passport?.user; // Session se (laptop)
};

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

    const paramId = req.params.id;
    const isCartCheckout = paramId === "cart";

    if (!isCartCheckout) {
      product = await productModel.findById(paramId).lean();
    }

    if (product) {
      cart = {
        products: [{ productId: product, quantity: 1 }]
      };
    } else {
      const userId = getUserId(req); // ✅ SIRF YE BADLA

      cart = await cartModel
        .findOne({ user: userId }) // ✅ session nahi — helper se
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