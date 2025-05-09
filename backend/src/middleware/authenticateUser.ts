import { Request, Response, NextFunction } from "express";

interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  status: string;
  salesforceAccountId: string | null;
  apiToken: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
import { prisma } from "../lib/prisma";
import { getAuth } from "@clerk/express";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // console.log("Authenticating user...");
  const auth = getAuth(req);
  // console.log("Auth object:", auth);

  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
    // console.log("Fetched user:", user);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (!user.clerkId) {
      res.status(400).json({ message: "Invalid user data: clerkId is null" });
      return;
    }

    req.user = {
      id: user.id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      status: user.status,
      salesforceAccountId: user.salesforceAccountId,
      apiToken: user.apiToken,
    };
    // console.log("User authenticated:", req.user);
    next(); // ✅ go to next middleware
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
