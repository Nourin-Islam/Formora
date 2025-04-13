import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";

const router = express.Router();

// GET all tags (for tag cloud)
router.get("/tags", async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { usageCount: "desc" },
      take: 50, // limit for tag cloud
    });
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ message: "Failed to fetch tags" });
  }
});

// GET tags for a specific template
router.get("/templates/:templateId/tags", async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const tags = await prisma.templateTag.findMany({
      where: { templateId: parseInt(templateId) },
      include: { tag: true },
    });

    res.json(tags.map((t) => t.tag));
  } catch (error) {
    console.error("Error fetching template tags:", error);
    res.status(500).json({ message: "Failed to fetch template tags" });
  }
});

// POST add tags to template (with auto-complete support)
router.post("/templates/:templateId/tags", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { tags } = req.body as { tags: string[] };
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const userId = req.user.id;

    // Verify template exists and user has permission
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (template.userId !== parseInt(userId) && !req.user.isAdmin) {
      res.status(403).json({ message: "Unauthorized to modify this template" });
      return;
    }

    // Process tags in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdTags = [];

      for (const tagName of tags) {
        // Normalize tag name (lowercase, trim)
        const normalizedName = tagName.trim().toLowerCase();

        // Find or create tag
        let tag = await tx.tag.findUnique({
          where: { name: normalizedName },
        });

        if (!tag) {
          tag = await tx.tag.create({
            data: { name: normalizedName },
          });
        }

        // Create TemplateTag relationship if not exists
        const existingRelation = await tx.templateTag.findUnique({
          where: {
            templateId_tagId: {
              templateId: parseInt(templateId),
              tagId: tag.id,
            },
          },
        });

        if (!existingRelation) {
          await tx.templateTag.create({
            data: {
              templateId: parseInt(templateId),
              tagId: tag.id,
            },
          });

          // Increment usage count
          await tx.tag.update({
            where: { id: tag.id },
            data: { usageCount: { increment: 1 } },
          });

          createdTags.push(tag);
        }
      }

      return createdTags;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding tags:", error);
    res.status(500).json({ message: "Failed to add tags" });
  }
});

// DELETE remove tag from template
router.delete("/templates/:templateId/tags/:tagId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { templateId, tagId } = req.params;
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const userId = req.user.id;

    // Verify template exists and user has permission
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (template.userId !== parseInt(userId) && !req.user.isAdmin) {
      res.status(403).json({ message: "Unauthorized to modify this template" });
      return;
    }

    // Verify tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(tagId) },
    });

    if (!tag) {
      res.status(404).json({ message: "Tag not found" });
      return;
    }

    // Remove relationship and decrement count in transaction
    await prisma.$transaction([
      prisma.templateTag.delete({
        where: {
          templateId_tagId: {
            templateId: parseInt(templateId),
            tagId: parseInt(tagId),
          },
        },
      }),
      prisma.tag.update({
        where: { id: parseInt(tagId) },
        data: { usageCount: { decrement: 1 } },
      }),
    ]);

    res.status(200).json({ message: "Tag removed from template" });
  } catch (error) {
    console.error("Error removing tag:", error);
    res.status(500).json({ message: "Failed to remove tag" });
  }
});

// GET tag suggestions (for autocomplete)
router.get("/tags/suggestions", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (typeof query !== "string" || query.length < 2) {
      res.status(400).json({ message: "Query must be at least 2 characters" });
      return;
    }

    const suggestions = await prisma.tag.findMany({
      where: {
        name: {
          startsWith: query.toLowerCase(),
          mode: "insensitive",
        },
      },
      take: 10,
    });

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching tag suggestions:", error);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
});

export default router;
