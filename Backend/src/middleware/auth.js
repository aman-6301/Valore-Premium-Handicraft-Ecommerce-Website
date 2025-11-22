import "dotenv/config";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Incoming access token:", token);

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
