import express from "express";
import { getProducts, getProductBySlug,
  getProductsByCategory,searchProducts } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProductBySlug);

export default router;
