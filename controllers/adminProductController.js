const { productModel } = require("../models/product");
const orderModel = require("../models/order");
const { categoryModel } = require("../models/category");

exports.getProducts = async (req, res) => {
  try {
    const result = await productModel.aggregate([
      {
        $group: {
          _id: "$category",
          products: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          products: { $slice: ["$products", 10] }
        }
      }
    ]);

    const formatted = result.reduce((acc, item) => {
      acc[item.category] = item.products;
      return acc;
    }, {});

    // ✅ res.render hata diya
    res.json({ success: true, data: formatted });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const orders = await orderModel.find({
      "products.productId": product._id,
    }).lean();

    // ✅ res.render hata diya
    res.json({ success: true, data: { product, orders } });

  } catch (err) {
    console.error("Admin product error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    let {
      productName, sku, price, discountPrice,
      stockQuantity, sizes, colors, material,
      gsm, category, description,
    } = req.body;

    if (typeof sizes === "string") sizes = [sizes];
    if (typeof colors === "string") colors = [colors];
    if (typeof category === "string") category = [category];

    if (!productName || !sku || !price || !stockQuantity || !material || !gsm) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let categoryIds = [];
    if (Array.isArray(category)) {
      for (let catName of category) {
        let catDoc = await categoryModel.findOne({ name: catName });
        if (!catDoc) catDoc = await categoryModel.create({ name: catName });
        categoryIds.push(catDoc._id);
      }
    }

    const imagePaths = req.files.map(file => file.path);

    const newProduct = await productModel.create({
      name: productName, sku, price, discountPrice,
      stock: stockQuantity, sizes, colors, material,
      gsm, description, images: imagePaths, category: categoryIds,
    });

    // ✅ res.redirect hata diya
    res.json({ success: true, message: "Product created", data: newProduct });

  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);

    // ✅ res.redirect hata diya
    res.json({ success: true, message: "Product deleted" });

  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};