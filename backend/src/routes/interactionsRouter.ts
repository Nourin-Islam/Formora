import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { addLike, removeLike, createComment, getComments, updateComment, deleteComment } from "../controllers/interactions.controller.ts";

const router = express.Router();

// Like Routes
router.post("/templates/:templateId/like", authenticateUser, addLike);
router.delete("/templates/:templateId/like", authenticateUser, removeLike);

// Comment Routes
router.post("/templates/:templateId/comments", authenticateUser, createComment);
router.get("/templates/:templateId/comments", getComments);
router.put("/comments/:commentId", authenticateUser, updateComment);
router.delete("/comments/:commentId", authenticateUser, deleteComment);

export default router;
