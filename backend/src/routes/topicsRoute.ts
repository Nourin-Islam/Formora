// routes/topicsRoute.ts
import express from "express";
import { getAllTopics, searchTopics, getTopicById, createTopic, updateTopic, deleteTopic } from "../controllers/topics.controller.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = express.Router();

router.get("/", getAllTopics);
router.get("/search", searchTopics);
router.get("/:id", getTopicById);
router.post("/", authenticateUser, requireAdmin, createTopic);
router.patch("/:id", authenticateUser, requireAdmin, updateTopic);
router.delete("/:id", authenticateUser, requireAdmin, deleteTopic);

export default router;
