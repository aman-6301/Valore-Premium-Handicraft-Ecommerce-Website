import Wishlist from "../models/Wishlist.js";

/**
 * GET /api/users/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    return res.json({
      products: wishlist ? wishlist.products : []
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * POST /api/users/wishlist
 * Body: { productId }
 */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId required" });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: productId } }, // prevents duplicates
      { upsert: true, new: true }
    );

    return res.json({
      message: "Product added to wishlist",
      products: wishlist.products
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * DELETE /api/users/wishlist/:productId
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: productId } },
      { new: true }
    );

    return res.json({
      message: "Product removed",
      products: wishlist ? wishlist.products : []
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
