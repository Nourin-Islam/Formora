import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { refreshEvents } from "../lib/refresh";

import { broadcastCommentUpdate } from "../websocket";

// Interfaces
interface UserPayload {
  id: number;
  isAdmin: boolean;
  [key: string]: any;
}

interface CommentCreateData {
  content: string;
}

interface CommentUpdateData {
  content: string;
}

// Like Controllers
export const addLike = async (req: Request, res: Response): Promise<void> => {
  try {
    // console.log("Adding like to template:", req.params.templateId);
    const { templateId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        templateId_userId: {
          templateId: parseInt(templateId),
          userId: parseInt(userId),
        },
      },
    });

    if (existingLike) {
      res.status(400).json({ message: "You already liked this template" });
      return;
    }

    const [like, updatedTemplate] = await prisma.$transaction([
      prisma.like.create({
        data: {
          templateId: parseInt(templateId),
          userId: parseInt(userId),
        },
      }),
      prisma.template.update({
        where: { id: parseInt(templateId) },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    refreshEvents.emit("refreshView");
    res.status(201).json(like);
  } catch (error) {
    console.error("Error adding like:", error);
    res.status(500).json({ message: "Failed to add like" });
  }
};

export const removeLike = async (req: Request, res: Response): Promise<void> => {
  try {
    // console.log("Removing like from template:", req.params.templateId);
    const { templateId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        templateId_userId: {
          templateId: parseInt(templateId),
          userId: parseInt(userId),
        },
      },
    });

    if (!existingLike) {
      res.status(404).json({ message: "Like not found" });
      return;
    }

    await prisma.$transaction([
      prisma.like.delete({
        where: {
          templateId_userId: {
            templateId: parseInt(templateId),
            userId: parseInt(userId),
          },
        },
      }),
      prisma.template.update({
        where: { id: parseInt(templateId) },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    refreshEvents.emit("refreshView");

    res.status(200).json({ message: "Like removed successfully" });
  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({ message: "Failed to remove like" });
  }
};

// Comment Controllers

// Comment Controllers
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { content } = req.body as CommentCreateData;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const numericTemplateId = parseInt(templateId);

    const comment = await prisma.comment.create({
      data: {
        content,
        templateId: numericTemplateId,
        userId: parseInt(userId),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Broadcast the new comment to all subscribers
    broadcastCommentUpdate(numericTemplateId, {
      userId: req.user.id,
      isAdmin: req.user.isAdmin,
    });

    res.status(201).json(comment);
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body as CommentUpdateData;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId !== parseInt(userId) && !req.user.isAdmin) {
      res.status(403).json({ message: "Unauthorized to update this comment" });
      return;
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Broadcast the updated comment to all subscribers
    broadcastCommentUpdate(comment.templateId, {
      userId: req.user.id,
      isAdmin: req.user.isAdmin,
    });

    res.status(200).json(updatedComment);
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Failed to update comment" });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.userId !== parseInt(userId) && !req.user.isAdmin) {
      res.status(403).json({ message: "Unauthorized to delete this comment" });
      return;
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    // Broadcast the comment deletion to all subscribers
    broadcastCommentUpdate(comment.templateId, {
      userId: req.user.id,
      isAdmin: req.user.isAdmin,
    });

    res.status(200).json({ message: "Comment deleted successfully" });
    refreshEvents.emit("refreshView");
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

/*
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const numericTemplateId = parseInt(templateId);

    const comments = await prisma.comment.findMany({
      where: { templateId: numericTemplateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // console.log("Fetched comments for template:", templateId, "Comments:", comments);
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

export const getCommentsForUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const requestingUserId = req.user.id;
    const requestingUserIsAdmin = req.user.isAdmin;
    const { templateId } = req.params;
    const numericTemplateId = parseInt(templateId);

    const comments = await prisma.comment.findMany({
      where: { templateId: numericTemplateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      comments,
      requestingUser: {
        userId: requestingUserId,
        isAdmin: requestingUserIsAdmin,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};
*/
