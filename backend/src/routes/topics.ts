import express from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET all topics

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const nameFilter = (req.query.name as string) || undefined;

    const topics = await prisma.topic.findMany({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.topic.count({
      where: nameFilter ? { name: { contains: nameFilter } } : undefined,
    });

    res.json({
      topics,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

// GET a topic by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const topicId = parseInt(req.params.id);

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topic" });
  }
});

// CREATE a new topic (admin only)
router.post("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const topic = await prisma.topic.create({
      data: { name },
    });

    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ error: "Failed to create topic" });
  }
});

// UPDATE a topic (admin only)
router.patch("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);
    const { name } = req.body;

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: { name },
    });

    res.json(updated);
  } catch (err) {
    if ((err as any).code === "P2025") {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update topic" });
  }
});

// DELETE a topic (admin only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);

    await prisma.topic.delete({
      where: { id: topicId },
    });

    res.json({ message: "Topic deleted successfully" });
  } catch (err) {
    if ((err as any).code === "P2025") {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete topic" });
  }
});

export default router;
