import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", auth, getWishlist);
router.post("/", auth, addToWishlist);
router.delete("/:productId", auth, removeFromWishlist);

export default router;
