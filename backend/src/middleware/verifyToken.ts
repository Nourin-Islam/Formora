import { verifyToken } from "@clerk/backend";
import { prisma } from "../lib/prisma.ts";

interface VerifiedUser {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  status: string;
}

export const verifyJwtToken = async (token: string): Promise<VerifiedUser> => {
  try {
    // Verify the token using Clerk
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,

      authorizedParties: process.env.ALLOWED_ORIGINS?.split(",") || [], // Replace with your authorized parties
    });

    // console.log("Token verification response:", JSON.stringify(verifiedToken, null, 2));

    // Extract the subject (user ID) from the verified token
    const clerkId = verifiedToken?.sub;

    if (!clerkId) {
      console.error("Missing subject ID in token payload");
      throw new Error("Invalid token payload");
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      console.error(`User with clerk ID ${clerkId} not found in database`);
      throw new Error("User not found");
    }

    return {
      id: user.id.toString(),
      clerkId: user.clerkId ?? "unknown",
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      status: user.status,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error("Invalid token");
  }
};
