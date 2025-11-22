import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", auth, getProfile);
router.put("/me", auth, updateProfile);

router.post("/address", auth, addAddress);
router.put("/address/:id", auth, updateAddress);
router.delete("/address/:id", auth, deleteAddress);

export default router;
