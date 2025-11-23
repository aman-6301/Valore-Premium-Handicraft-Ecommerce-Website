import express from "express";
import { getAllCategories, getCategoryTree } from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/tree", getCategoryTree);

export default router;
