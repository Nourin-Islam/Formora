// routes/topicsRoute
import express from "express";
import { getAllTopics, createTopic, updateTopic, deleteTopic } from "../controllers/topics.controller";
import { authenticateUser } from "../middleware/authenticateUser";
import { requireAdmin } from "../middleware/auth";

const router = express.Router();
// @ts-ignore
router.get("/", getAllTopics);
router.post("/", authenticateUser, requireAdmin, createTopic);
router.patch("/:id", authenticateUser, requireAdmin, updateTopic);
router.delete("/:id", authenticateUser, requireAdmin, deleteTopic);

// router.get("/search", searchTopics);
// router.get("/:id", getTopicById);

export default router;
