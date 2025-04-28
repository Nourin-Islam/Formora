// routes/topicsRoute.ts
import express from "express";
import { getAllTopics, createTopic, updateTopic, deleteTopic } from "../controllers/topics.controller.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = express.Router();

router.get("/", getAllTopics);
router.post("/", authenticateUser, requireAdmin, createTopic);
router.patch("/:id", authenticateUser, requireAdmin, updateTopic);
router.delete("/:id", authenticateUser, requireAdmin, deleteTopic);

// router.get("/search", searchTopics);
// router.get("/:id", getTopicById);

export default router;
