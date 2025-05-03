// users.controller
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { clerkClient } from "@clerk/express";
import { refreshEvents } from "../lib/refresh";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { page = 1, limit = 10, sortBy = "name", sortOrder = "asc", email } = req.query;
    const where: any = {};
    if (email) where.email = { contains: email as string, mode: "insensitive" };

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

    const totalCount = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({ users, totalPages, totalCount });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  // console.log("Updating user:", req.body, req.params.id);
  try {
    // Verify current user has permission to update
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { isAdmin, isBlocked } = req.body;
    const userId = parseInt(req.params.id);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin, isBlocked },
    });

    if (user.clerkId) {
      try {
        await clerkClient.users.updateUserMetadata(user.clerkId, {
          publicMetadata: { isAdmin },
        });
      } catch (clerkError) {
        console.error("Error updating Clerk metadata:", clerkError);
        res.status(500).json({ message: "Failed to sync metadata with Clerk" });
        return;
      }
    }

    res.json(user);
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.clerkId) {
      try {
        const response = await clerkClient.users.deleteUser(user.clerkId);
        // console.log("Clerk response:", response);
      } catch (clerkError) {
        res.status(500).json({ message: "Failed to delete user from authentication system" });
        return;
      }
    }

    const rest = await prisma.user.delete({ where: { id: userId } });
    // console.log("Deleted user from database:", rest);
    res.json({ message: "User deleted successfully" });
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
