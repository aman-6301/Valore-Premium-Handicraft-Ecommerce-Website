import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String, // used later for Cloudinary deletions
      default: null
    },
    altText: {
      type: String,
      default: ""
    },
    orderIndex: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("ProductImage", productImageSchema);
