import { Webhook } from "svix";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./lib/prisma.js";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
  };
}

export const handleClerkWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing Clerk webhook secret");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const payload = req.body.toString();
  const headers = {
    "svix-id": req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(payload, headers) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  try {
    const { type, data } = event;

    switch (type) {
      case "user.created":
        await prisma.user.create({
          data: {
            clerkId: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            status: "ACTIVE",
            passwordHash: "", // Provide a default or hashed value as required
          },
        });
        break;

      case "user.updated":
        await prisma.user.update({
          where: { clerkId: data.id },
          data: {
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            email: data.email_addresses[0].email_address,
          },
        });
        break;

      case "user.deleted":
        await prisma.user.update({
          where: { clerkId: data.id },
          data: { status: "DELETED" },
        });
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
