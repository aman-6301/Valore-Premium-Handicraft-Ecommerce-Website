import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true,
      unique: true
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductImage"
      }
    ],
    meta: {
      material: String,
      artisan: String,
      weight: String,
      dimensions: String,
      color: String
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    stock: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
