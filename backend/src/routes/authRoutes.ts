// routes/authRoutes.ts
import express from "express";
import { requireUser } from "../middleware/auth.ts";
import { syncClerkUser } from "../services/userService.ts"; // Adjust the import path as necessary

const router = express.Router();

// Protected route example
router.get("/profile", requireUser, async (req, res) => {
  try {
    const { userId } = req.auth;

    // Sync user with our database
    const user = await syncClerkUser(userId);

    res.json({
      message: "You have accessed a protected route!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
