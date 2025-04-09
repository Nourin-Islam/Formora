import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.ts";
import { getAuth } from "@clerk/express";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // console.log("Authenticating user...");
  const auth = getAuth(req);
  // console.log("Auth object:", auth);

  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
    // console.log("Fetched user:", user);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.clerkId) {
      res.status(400).json({ error: "Invalid user data: clerkId is null" });
      return;
    }

    req.user = {
      id: user.id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      status: user.status,
    };

    next(); // ✅ go to next middleware
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
