import express from "express";
import User from "../models/User.js";

const router = express.Router();

// --------------------------------------
// POST - Register or update user
// --------------------------------------
router.post("/register", async (req, res) => {
try {
const { uid, email, name } = req.body;

if (!uid || !email || !name) {
  return res.status(400).json({
    success: false,
    message: "uid, email and name are required",
  });
}

// Check if user already exists
let user = await User.findOne({ uid });

if (!user) {
  // Create new user
  user = await User.create({ uid, email, name });
} else {
  // If exists, update name
  user.name = name;
  await user.save();
}

return res.status(200).json({
  success: true,
  user,
});

} catch (err) {
return res.status(500).json({
success: false,
error: err.message,
});
}
});

// --------------------------------------
// GET - Retrieve users (all or by name)
// --------------------------------------
router.get("/all", async (req, res) => {
try {
const { name } = req.query;
let users;

if (name) {
  users = await User.find({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
} else {
  users = await User.find();
}

res.status(200).json({ success: true, users });


} catch (err) {
res.status(500).json({ success: false, error: err.message });
}
});

export default router;
