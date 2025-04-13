import express from "express";
import { prisma } from "../lib/prisma.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";

const router = express.Router();

// GET all questions for a template
router.get("/template/:templateId", async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const questions = await prisma.question.findMany({
      where: { templateId },
      orderBy: { position: "asc" },
    });

    res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// GET a specific question by ID
router.get("/:id", async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (err) {
    console.error("Error fetching question:", err);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

// CREATE a new question
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { templateId, title, description, questionType, position, showInTable, options, correctAnswers } = req.body;

    // Check if template exists and user has permission
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    // Check if user is owner or admin
    if (!req.user || template.userId !== Number(req.user.id) || !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to add questions to this template" });
    }

    // If position is not provided, put it at the end
    let finalPosition = position;
    if (finalPosition === undefined) {
      const lastQuestion = await prisma.question.findFirst({
        where: { templateId: parseInt(templateId) },
        orderBy: { position: "desc" },
      });
      finalPosition = lastQuestion ? lastQuestion.position + 1 : 0;
    }

    const question = await prisma.question.create({
      data: {
        templateId: parseInt(templateId),
        title,
        description: description || "",
        questionType,
        position: finalPosition,
        showInTable: showInTable !== undefined ? showInTable : false,
        options: options || null,
        correctAnswers: correctAnswers || null,
      },
    });

    res.status(201).json(question);
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// UPDATE a question
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    // Find the question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { template: true },
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Check if user is the template owner or admin
    if (question.template.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this question" });
    }

    const { title, description, questionType, position, showInTable, options, correctAnswers } = req.body;

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(questionType !== undefined && { questionType }),
        ...(position !== undefined && { position }),
        ...(showInTable !== undefined && { showInTable }),
        ...(options !== undefined && { options }),
        ...(correctAnswers !== undefined && { correctAnswers }),
      },
    });

    res.json(updatedQuestion);
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// DELETE a question
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    // Find the question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { template: true },
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Check if user is the template owner or admin
    if (question.template.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this question" });
    }

    // Delete the question
    await prisma.question.delete({
      where: { id: questionId },
    });

    // Reorder the remaining questions
    const templateQuestions = await prisma.question.findMany({
      where: { templateId: question.templateId },
      orderBy: { position: "asc" },
    });

    const updatePromises = templateQuestions.map((q, idx) =>
      prisma.question.update({
        where: { id: q.id },
        data: { position: idx },
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// Reorder questions
router.post("/reorder", authenticateUser, async (req, res) => {
  try {
    const { templateId, questionOrder } = req.body;

    if (!templateId || !questionOrder || !Array.isArray(questionOrder)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    // Check if template exists and user has permission
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check if user is owner or admin
    if (template.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to reorder questions for this template" });
    }

    // Update question positions
    const updatePromises = questionOrder.map((questionId, index) =>
      prisma.question.update({
        where: { id: parseInt(questionId) },
        data: { position: index },
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: "Questions reordered successfully" });
  } catch (err) {
    console.error("Error reordering questions:", err);
    res.status(500).json({ error: "Failed to reorder questions" });
  }
});

export default router;
