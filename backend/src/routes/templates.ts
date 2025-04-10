import express from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

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
router.post("/", async (req, res) => {
  try {
    const { title, description, topicId, isPublic, imageUrl } = req.body;

    const newTemplate = await prisma.template.create({
      data: {
        userId: req.user?.id
          ? parseInt(req.user.id, 10)
          : (() => {
              throw new Error("User is not authenticated");
            })(),
        title,
        description,
        topicId,
        isPublic,
        imageUrl,
      },
    });

    res.status(201).json(newTemplate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Get a single template by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, name: true } },
        topic: true,
      },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: "Error fetching template" });
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
