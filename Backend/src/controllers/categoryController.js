import Category from "../models/Category.js";

// GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/categories/tree
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find();

    // build nested tree structure
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => String(cat.parentId) === String(parentId))
        .map(cat => ({
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          children: buildTree(cat._id)
        }));
    };

    return res.json({ tree: buildTree(null) });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
