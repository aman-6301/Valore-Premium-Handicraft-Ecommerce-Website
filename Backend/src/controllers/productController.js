import Product from "../models/Product.js";
import ProductImage from "../models/ProductImage.js";
import Category from "../models/Category.js";

// GET /api/products (listing + filters)
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort,
      priceMin,
      priceMax,
      category,
      material,
      artisan,
      tags
    } = req.query;

    const filter = { isActive: true };

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    if (material) {
      filter["meta.material"] = material;
    }

    if (artisan) {
      filter["meta.artisan"] = artisan;
    }

    if (tags) {
      filter.tags = { $in: tags.split(",") };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        filter.categoryId = cat._id;
      }
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 }
    };

    const products = await Product.find(filter)
      .sort(sortOptions[sort] || {})
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("name slug price images stock");

    return res.json({
      products,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/products/:slug (product details page)
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isActive: true })
      .populate("images")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const related = await Product.find({
      categoryId: product.categoryId,
      _id: { $ne: product._id }
    })
      .limit(4)
      .select("name slug price images");

    return res.json({
      product,
      relatedProducts: related
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({
      categoryId: category._id,
      isActive: true
    })
      .select("name slug price images stock")
      .limit(20);

    return res.json({
      category: category.name,
      products
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// search product by keyword
export const searchProducts = async (req, res) => {
  try {
    let { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Normalize query
    query = query.toLowerCase().trim();

    // Basic plural handling → removes trailing "s"
    const baseQuery = query.replace(/s$/i, "");

    // Split into words for multi-term search
    const terms = baseQuery.split(" ").filter(Boolean);

    // Create regex array for OR matching
    const regexConditions = terms.map((term) => new RegExp(term, "i"));

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $in: regexConditions } },
        { description: { $in: regexConditions } },
        { tags: { $in: regexConditions } },
        { "meta.material": { $in: regexConditions } },
        { "meta.artisan": { $in: regexConditions } }
      ]
    })
      .select("name slug price images stock")
      .limit(20);

    return res.json({
      query,
      count: products.length,
      products
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


