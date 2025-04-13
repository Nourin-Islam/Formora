import express from "express";
import { prisma } from "../lib/prisma.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";

const router = express.Router();
router.use(authenticateUser);

// Get all templates (optional: public only)
router.get("/", async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: {
        isPublic: true,
      },
      include: {
        user: { select: { id: true, name: true } },
        topic: true,
      },
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Create a new template
// In your templates router

// Create a new template with all relations
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { title, description, topicId, isPublic, isPublished, imageUrl, tags = [], accessUsers = [], questions = [] } = req.body;

    console.log("Received data:", req.body);
    // Validate required fields
    if (!title || !description || !topicId) {
      res.status(400).json({ error: "Title, description, and topic are required" });
      return;
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      console.log("User ID:", req.user.id);
      // 1. Create the base template
      const template = await tx.template.create({
        data: {
          title,
          description,
          topicId: Number(topicId),
          userId: Number(req.user.id),
          isPublic: Boolean(isPublic),
          isPublished: Boolean(isPublished),
          imageUrl: imageUrl || null,
        },
      });

      // 2. Process tags (connect or create)
      if (tags.length > 0) {
        await Promise.all(
          tags.map(async (tagName: string) => {
            const normalizedName = tagName.trim().toLowerCase();

            // First find or create the tag
            const tag = await tx.tag.upsert({
              where: { name: normalizedName },
              update: { usageCount: { increment: 1 } },
              create: { name: normalizedName },
            });

            // Then create the template-tag relationship
            await tx.templateTag.create({
              data: {
                templateId: template.id,
                tagId: tag.id,
              },
            });
          })
        );
      }

      // 3. Process access users (if template is not public)
      if (!isPublic && accessUsers.length > 0) {
        await tx.templateAccess.createMany({
          data: accessUsers.map((userId: number) => ({
            templateId: template.id,
            userId: Number(userId),
          })),
        });
      }

      // 4. Process questions
      if (questions.length > 0) {
        await tx.question.createMany({
          data: questions.map((q: any, index: number) => ({
            templateId: template.id,
            title: q.title,
            description: q.description || "",
            questionType: q.questionType,
            position: index,
            showInTable: Boolean(q.showInTable),
            options: q.options || null,
            correctAnswers: q.correctAnswers || null,
          })),
        });
      }

      // Return the complete template with all relations
      return await tx.template.findUnique({
        where: { id: template.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          topic: true,
          questions: { orderBy: { position: "asc" } },
          tags: { include: { tag: true } },
          accesses: { include: { user: { select: { id: true, name: true } } } },
        },
      });
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({
      error: "Failed to create template",
      details: process.env.NODE_ENV === "development" ? (err as Error).message : undefined,
    });
  }
});

// Get a single template by ID
// Get single template
router.get("/:id", async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        topic: true,
        questions: { orderBy: { position: "asc" } },
        tags: { include: { tag: true } },
        accesses: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { forms: true, likes: true } },
      },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.json(template);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// Update a template
router.patch("/:id", async (req, res) => {
  try {
    const { title, description, isPublic, imageUrl } = req.body;
    const id = parseInt(req.params.id);

    const template = await prisma.template.update({
      where: { id },
      data: { title, description, isPublic, imageUrl },
    });

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: "Failed to update template" });
  }
});

// Delete a template
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.template.delete({ where: { id } });

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete template" });
  }
});

export default router;
