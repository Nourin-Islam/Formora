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
    deleted?: boolean;
  };
}

export const handleClerkWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  // console.log("💥 Webhook triggered");

  if (!WEBHOOK_SECRET) {
    console.error("Missing Clerk webhook secret");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Get raw body as string
  const payload = req.body.toString();
  const headers = {
    "svix-id": req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  // console.log("Received webhook:", payload, headers);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;

  try {
    // Add timestamp tolerance (300 seconds = 5 minutes)
    event = wh.verify(payload, headers) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return res.status(401).json({
      error: "Invalid webhook signature",
      details: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const { type, data } = event;

    switch (type) {
      case "user.created":
        await prisma.user.upsert({
          where: { clerkId: data.id },
          update: {
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            status: "ACTIVE",
          },
          create: {
            clerkId: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            status: "ACTIVE",
            passwordHash: "",
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
        console.log(`Webhook received for deleted user ${data.id}, no DB action taken.`);
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
