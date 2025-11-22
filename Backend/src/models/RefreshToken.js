import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tokenHash: {
      type: String,
      required: true
    },
    userAgent: {
      type: String
    },
    ip: {
      type: String
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index auto-removes expired records
    }
  },
  { timestamps: true }
);

export default mongoose.model("RefreshToken", refreshTokenSchema);
