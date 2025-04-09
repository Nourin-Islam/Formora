import express from "express";
import { protectedRoute, adminRoute } from "../middleware/auth.ts";
import { prisma } from "../lib/prisma.ts";

const router = express.Router();

// Create a new template
router.post("/", protectedRoute, async (req, res) => {
  try {
    const { title, description, topicId, isPublic, tags } = req.body;

    const template = await prisma.template.create({
      data: {
        title,
        description,
        topicId,
        isPublic,
        userId: req.user!.id,
        tags: {
          create: tags.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Get all templates (public or user's)
router.get("/", async (req, res) => {
  try {
    const where: any = { isPublic: true };

    if (req.user) {
      where.OR = [{ isPublic: true }, { userId: req.user.id }, { accesses: { some: { userId: req.user.id } } }];
    }

    const templates = await prisma.template.findMany({
      where,
      include: {
        user: { select: { name: true } },
        topic: true,
        tags: { include: { tag: true } },
      },
    });

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get template by ID
router.get("/:id", async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { name: true } },
        topic: true,
        questions: { orderBy: { position: "asc" } },
        tags: { include: { tag: true } },
        _count: { select: { forms: true } },
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check access
    if (!template.isPublic && (!req.user || (req.user.id !== template.userId && !req.user.isAdmin && !template.accesses.some((a) => a.userId === req.user?.id)))) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// Add more routes for updating, deleting templates, etc.

export default router;
