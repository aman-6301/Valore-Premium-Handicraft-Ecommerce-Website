import bcrypt from "bcryptjs";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";

/**
 * Helper: set refresh token cookie
 */
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip,
      expiresAt
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Optional: clear old tokens for this device / user-agent
    await RefreshToken.deleteMany({
      user: user._id,
      userAgent: req.headers["user-agent"] || ""
    });

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip,
      expiresAt
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const incomingToken = req.cookies?.refreshToken;

    if (!incomingToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(incomingToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const userId = decoded.userId;

    const storedTokens = await RefreshToken.find({ user: userId });

    if (!storedTokens || storedTokens.length === 0) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    let matchedTokenDoc = null;

    for (const tokenDoc of storedTokens) {
      const isMatch = await bcrypt.compare(incomingToken, tokenDoc.tokenHash);
      if (isMatch) {
        matchedTokenDoc = tokenDoc;
        break;
      }
    }

    if (!matchedTokenDoc) {
      return res.status(401).json({ message: "Refresh token not recognized" });
    }

    // Token rotation: delete old and issue new
    await RefreshToken.deleteOne({ _id: matchedTokenDoc._id });

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip,
      expiresAt
    });

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      message: "Token refreshed",
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const incomingToken = req.cookies?.refreshToken;

    if (incomingToken) {
      try {
        const decoded = verifyRefreshToken(incomingToken);
        const userId = decoded.userId;

        // Remove all refresh tokens for this user (simpler)
        await RefreshToken.deleteMany({ user: userId });
      } catch (err) {
        // ignore invalid token on logout
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
