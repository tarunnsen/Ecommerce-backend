const { productModel } = require("../models/product");

// ======================
// HOMEPAGE
// ======================
exports.getHome = async (req, res) => {
  try {
    const bannerProduct = await productModel.aggregate([
      { $sample: { size: 1 } }
    ]);

    const alternateBannerProduct = await productModel.aggregate([
      { $sample: { size: 1 } }
    ]);

    const featuredCategories = await productModel.aggregate([
      { $unwind: "$category" },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      { $unwind: "$categoryData" },
      {
        $group: {
          _id: "$categoryData._id",
          name: { $first: "$categoryData.name" },
          products: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          name: 1,
          products: { $slice: ["$products", 2] }
        }
      }
    ]);

    const newArrivals = await productModel
      .find()
      .sort({ createdAt: -1 })
      .limit(8);

    // ✅ res.render hata diya — JSON bhej rahe hain React ko
    res.json({
      success: true,
      data: {
        bannerProduct: bannerProduct[0] || null,
        alternateBannerProduct: alternateBannerProduct[0] || null,
        featuredCategories,
        newArrivals
      }
    });

  } catch (err) {
    console.error("Home Page Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ======================
// THANK YOU PAGE
// ======================
exports.thankYouPage = (req, res) => {
  // ✅ React handle karega thank you page
  res.json({ success: true, message: "Order placed successfully" });
};

// ======================
// PRODUCT DETAILS PAGE
// ======================
exports.getProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const relatedProducts = await productModel.find({
      category: { $in: product.category },
      _id: { $ne: product._id }
    })
    .limit(4)
    .lean();

    // ✅ res.render hata diya — JSON bhej rahe hain React ko
    res.json({
      success: true,
      data: {
        product,
        relatedProducts: relatedProducts || []
      }
    });

  } catch (err) {
    console.error("Product Page Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};