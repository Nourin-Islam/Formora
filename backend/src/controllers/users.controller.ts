// users.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { clerkClient } from "@clerk/express";
import { refreshEvents } from "../lib/refresh.ts";
import { getAuth } from "@clerk/express";
import { z } from "zod";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      res.json([]);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [{ name: { contains: searchTerm as string, mode: "insensitive" } }, { email: { contains: searchTerm as string, mode: "insensitive" } }],
      },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  console.log("Updating user:", req.body, req.params.id);
  try {
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
        res.status(500).json({ error: "Failed to sync metadata with Clerk" });
        return;
      }
    }

    res.json(user);
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.clerkId) {
      try {
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (clerkError) {
        res.status(500).json({ error: "Failed to delete user from authentication system" });
        return;
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "User deleted successfully" });
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(403).json({ error: "Not Authorized" });
      return;
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        isAdmin: true,
        status: true,
        languagePreference: true,
        themePreference: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    res.json({ user });
    return;
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({
      error: "Failed to fetch user preferences",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

const PreferencesSchema = z.object({
  languagePreference: z.string().min(2).max(5), // e.g. "en", "fr", "es"
  themePreference: z.enum(["light", "dark", "system"]),
});

export const setUserPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(403).json({ error: "Not Authorized" });
      return;
    }

    // Validate request body
    const validationResult = PreferencesSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid preferences data",
        details: validationResult.error.flatten(),
      });
      return;
    }

    const { languagePreference, themePreference } = validationResult.data;
    const userId = req.user.id; // From authenticateUser middleware

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        languagePreference,
        themePreference,
        updatedAt: new Date(), // Explicitly set updatedAt
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        isAdmin: true,
        status: true,
        languagePreference: true,
        themePreference: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: { updatedUser },
    });
    return;
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({
      error: "Failed to update preferences",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
