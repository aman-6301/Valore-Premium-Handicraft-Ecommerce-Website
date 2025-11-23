import Product from "../models/Product.js";
import ProductImage from "../models/ProductImage.js";
import Category from "../models/Category.js";

// GET /api/products (listing + filters)
export const getProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 12,
      sort,
      priceMin,
      priceMax,
      material,
      artisan,
      tags,
      category,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const matchStage = { isActive: true };

    // Filter: Category
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        matchStage.categoryId = categoryDoc._id;
      }
    }

    // Filter: Price range
    if (priceMin || priceMax) {
      matchStage.price = {};
      if (priceMin) matchStage.price.$gte = Number(priceMin);
      if (priceMax) matchStage.price.$lte = Number(priceMax);
    }

    // Filter: Material
    if (material) {
      matchStage["meta.material"] = material;
    }

    // Filter: Artisan
    if (artisan) {
      matchStage["meta.artisan"] = { $regex: artisan, $options: "i" };
    }

    // Filter: Tags (comma-separated)
    if (tags) {
      const tagsArr = tags.split(",");
      matchStage.tags = { $in: tagsArr };
    }

    // Sorting
    let sortStage = {};
    if (sort === "price_asc") sortStage.price = 1;
    if (sort === "price_desc") sortStage.price = -1;
    if (sort === "newest") sortStage.createdAt = -1;

    const dataPipeline = [];

    if (Object.keys(sortStage).length > 0) {
      dataPipeline.push({ $sort: sortStage });
    } else {
      // default sort when no sort param is provided
      dataPipeline.push({ $sort: { createdAt: -1 } });
    }

    dataPipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "productimages",
          localField: "images",
          foreignField: "_id",
          as: "images",
        },
      }
    );

    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          data: dataPipeline,
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Product.aggregate(pipeline);

    const products = result[0].data;
    const totalCount = result[0].totalCount[0]?.count || 0;

    return res.json({
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      products,
    });
  } catch (error) {
    console.error("Aggregation error:", error);
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
      _id: { $ne: product._id },
    })
      .limit(4)
      .select("name slug price images");

    return res.json({
      product,
      relatedProducts: related,
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
      isActive: true,
    })
      .select("name slug price images stock")
      .limit(20);

    return res.json({
      category: category.name,
      products,
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
        { "meta.artisan": { $in: regexConditions } },
      ],
    })
      .select("name slug price images stock")
      .limit(20);

    return res.json({
      query,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
