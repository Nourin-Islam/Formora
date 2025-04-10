import express from "express";
import { requireAdmin } from "../middleware/auth.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { prisma } from "../lib/prisma.ts";
import { clerkClient } from "@clerk/express";

const router = express.Router();
router.use(authenticateUser); // 🔑 attach user before all routes

// Get all users
router.get("/users", requireAdmin, async (req, res) => {
  console.log("Came to admin route.");
  try {
    const { page = 1, limit = 10, sortBy = "name", sortOrder = "asc", email } = req.query;

    const where: any = {};
    if (email) where.email = { contains: email as string, mode: "insensitive" };
    // console.log("Fetching users..1.");
    const users = await prisma.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { [sortBy as string]: sortOrder },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isBlocked: true,
        createdAt: true,
      },
    });
    // console.log("users", users);
    const totalCount = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      users,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user
// Update user
router.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { isAdmin, isBlocked } = req.body;
    const userId = parseInt(req.params.id);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin, isBlocked },
    });

    // 🔁 Sync to Clerk metadata
    if (user.clerkId) {
      try {
        await clerkClient.users.updateUserMetadata(user.clerkId, {
          publicMetadata: { isAdmin },
        });
      } catch (clerkError) {
        console.error("Error updating Clerk metadata:", clerkError);
        res.status(500).json({ error: "Failed to sync metadata with Clerk" });
        return;
      }
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // First get the Clerk ID before deleting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete from Clerk first
    if (user.clerkId) {
      try {
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (clerkError) {
        res.status(500).json({
          error: "Failed to delete user from authentication system",
        });
        return;
      }
    }

    // Then delete from our database
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
