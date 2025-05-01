import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { prisma } from "./lib/prisma";
import { verifyJwtToken } from "./middleware/verifyToken"; // Your auth utility

interface CommentUpdate {
  templateId: number;
  comments: any[];
}

const wss = new WebSocketServer({ noServer: true });
const commentSubscriptions = new Map<number, Set<import("ws").WebSocket>>();

export function setupWebSocket(server: any) {
  server.on("upgrade", (request: IncomingMessage, socket: any, head: Buffer) => {
    const pathname = request.url?.split("?")[0];

    if (pathname === "/comments") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const templateId = url.searchParams.get("templateId");
    // const token = url.searchParams.get("token");
    // console.log("New WebSocket connection:", { templateId, token });
    // console.log("process.env.CLERK_SECRET_KEY: ", process.env.CLERK_SECRET_KEY);

    if (!templateId) {
      ws.close(4000, "Template ID required");
      return;
    }

    const numericTemplateId = parseInt(templateId);

    // Add to subscriptions
    if (!commentSubscriptions.has(numericTemplateId)) {
      commentSubscriptions.set(numericTemplateId, new Set());
    }
    commentSubscriptions.get(numericTemplateId)?.add(ws);

    // Send initial comments
    const comments = await getCommentsFromDB(numericTemplateId);
    ws.send(
      JSON.stringify({
        templateId: numericTemplateId,
        comments,
      })
    );

    ws.on("close", () => {
      commentSubscriptions.get(numericTemplateId)?.delete(ws);
    });
  });
}

async function getCommentsFromDB(templateId: number) {
  return await prisma.comment.findMany({
    where: { templateId },
    include: {
      user: {
        select: {
          id: true,
          clerkId: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function broadcastCommentUpdate(templateId: number) {
  const subscribers = commentSubscriptions.get(templateId);
  if (!subscribers) return;

  getCommentsFromDB(templateId).then((comments) => {
    const update: CommentUpdate = {
      templateId,
      comments,
    };

    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  });
}
