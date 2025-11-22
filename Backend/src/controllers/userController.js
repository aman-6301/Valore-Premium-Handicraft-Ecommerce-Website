import User from "../models/User.js";
import Address from "../models/Address.js";

/**
 * GET /api/users/me
 */
export const getProfile = async (req, res) => {
  try {
    return res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * PUT /api/users/me
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select("-password");

    return res.json({
      message: "Profile updated",
      user: updated
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * POST /api/users/address
 */
export const addAddress = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user._id };

    const address = await Address.create(data);

    // push reference to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { addresses: address._id }
    });

    return res.status(201).json({
      message: "Address added",
      address
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * PUT /api/users/address/:id
 */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Address.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({
      message: "Address updated",
      address: updated
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * DELETE /api/users/address/:id
 */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Address.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Address not found" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { addresses: id }
    });

    return res.json({ message: "Address deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
