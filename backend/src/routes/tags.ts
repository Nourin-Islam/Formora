import express from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET all tags with pagination, sorting, and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";
    const nameFilter = (req.query.name as string) || undefined;

    const tags = await prisma.tag.findMany({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.tag.count({
      where: nameFilter ? { name: { contains: nameFilter, mode: "insensitive" } } : undefined,
    });

    res.json({
      tags,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// Search tags for autocomplete
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    const limit = parseInt(req.query.limit as string) || 10;

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: [
        { usageCount: "desc" }, // Show most used tags first
        { name: "asc" }, // Then alphabetically
      ],
      take: limit,
    });

    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: "Failed to search tags" });
  }
});

// GET a tag by ID
router.get("/:id", async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tag" });
  }
});

// CREATE a new tag
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;

    // Check if tag already exists (case insensitive)
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingTag) {
      res.json(existingTag);
      return; // Return existing tag instead of creating duplicate
    }

    const tag = await prisma.tag.create({
      data: { name },
    });

    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: "Failed to create tag" });
  }
});

// UPDATE a tag (admin only)
router.patch("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    const { name } = req.body;

    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: { name },
    });

    res.json(updated);
  } catch (err) {
    if ((err as any).code === "P2025") {
      res.status(404).json({ error: "Tag not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update tag" });
  }
});

// DELETE a tag (admin only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);

    await prisma.tag.delete({
      where: { id: tagId },
    });

    res.json({ message: "Tag deleted successfully" });
  } catch (err) {
    if ((err as any).code === "P2025") {
      res.status(404).json({ error: "Tag not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

export default router;
