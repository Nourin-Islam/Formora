import { User } from "@prisma/client";

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
