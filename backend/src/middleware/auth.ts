import type { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        email: string;
        name: string | null;
        isAdmin: boolean;
        status: string;
      };
      auth?: {
        userId: string;
      };
    }
  }
}

export const clerkAuth = ClerkExpressRequireAuth();

export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        isAdmin: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    if (!user.clerkId) {
      return res.status(401).json({ error: "Invalid user data" });
    }
    req.user = { ...user, id: user.id.toString(), clerkId: user.clerkId };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const protectedRoute = [clerkAuth, requireUser];
export const adminRoute = [clerkAuth, requireUser, requireAdmin];
