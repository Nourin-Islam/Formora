import { clerkClient } from "@clerk/express";
import { prisma } from "../lib/prisma.js";

export async function syncClerkUser(clerkUserId: string) {
  try {
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const primaryEmail = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!primaryEmail) {
      throw new Error("User has no primary email address");
    }

    // Check if user exists in your database
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: primaryEmail }, { clerkId: clerkUserId }],
      },
    });

    // If user exists but doesn't have clerkId, update it
    if (user && !user.clerkId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { clerkId: clerkUserId },
      });
    }

    // If not, create user in your database
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
          passwordHash: "clerk-managed", // Since Clerk handles auth
          clerkId: clerkUserId,
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error syncing user:", error);
    throw new Error("Failed to retrieve or create user");
  }
}

export async function getCurrentUser(clerkUserId: string) {
  // Get user from database, sync with Clerk if needed
  try {
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      user = await syncClerkUser(clerkUserId);
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    throw new Error("Failed to get current user");
  }
}
