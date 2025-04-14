// src/routes/questions.ts

import express, { Request, Response } from "express";
import { PrismaClient, QuestionType, Prisma } from "@prisma/client";
import { authenticateUser } from "../middleware/authenticateUser.ts";

const router = express.Router();
const prisma = new PrismaClient();

interface QuestionData {
  templateId: number;
  title: string;
  description?: string;
  questionType: string;
  position: number;
  showInTable: boolean;
  options?: any[];
  correctAnswers?: any[];
}

interface ReorderRequestBody {
  templateId: number;
  questionOrder: string[];
}

// Create a new question
// In your questions router
router.post("/", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { templateId, title, description = "", questionType, position, showInTable = false, options = [], correctAnswers = [] } = req.body;

    // Verify template exists and user has permission
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId.toString()) },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    if (!req.user || template.userId !== parseInt(req.user.id.toString()) || !req.user.isAdmin) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const question = await prisma.question.create({
      data: {
        templateId: template.id,
        title,
        description,
        questionType: questionType as QuestionType,
        position,
        showInTable,
        options: options.length ? options : undefined,
        correctAnswers: correctAnswers.length ? correctAnswers : undefined,
      },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// Get all questions for a template
router.get("/template/:templateId", async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.templateId);

    const questions = await prisma.question.findMany({
      where: { templateId },
      orderBy: { position: "asc" },
    });

    // Parse string options back to objects
    const questionsWithParsedOptions = questions.map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options as string) : null,
    }));

    res.json(questionsWithParsedOptions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Update a question
router.put("/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);
    const { title, description, questionType, position, showInTable, options } = req.body as QuestionData;

    // Verify the user owns the template or is admin
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { template: true },
    });

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    if (!req.user || question.template.userId !== parseInt(req.user.id.toString()) || !req.user.isAdmin) {
      res.status(403).json({ error: "Unauthorized to update this question" });
      return;
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        title,
        description,
        questionType: questionType as QuestionType,
        position,
        showInTable,
        options: options ? JSON.stringify(options) : Prisma.JsonNull,
      },
    });

    res.json({
      ...updatedQuestion,
      options: updatedQuestion.options ? JSON.parse(updatedQuestion.options as string) : null,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete a question
router.delete("/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);

    // Verify the user owns the template or is admin
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { template: true },
    });

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    if (!req.user || question.template.userId !== parseInt(req.user.id.toString()) || !req.user.isAdmin) {
      res.status(403).json({ error: "Unauthorized to delete this question" });
      return;
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    // Reorder remaining questions
    const remainingQuestions = await prisma.question.findMany({
      where: { templateId: question.templateId },
      orderBy: { position: "asc" },
    });

    // Update positions to be sequential
    const updatePromises = remainingQuestions.map((q, index) =>
      prisma.question.update({
        where: { id: q.id },
        data: { position: index },
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// Update question positions (for drag and drop reordering)
router.post("/reorder", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { templateId, questionOrder } = req.body as ReorderRequestBody;

    // Verify the user owns the template or is admin
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId.toString()) },
      include: { user: true },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    if (!req.user || template.userId !== parseInt(req.user.id.toString()) || !req.user.isAdmin) {
      res.status(403).json({ error: "Unauthorized to reorder questions for this template" });
      return;
    }

    // Update each question's position
    const updatePromises = questionOrder.map((questionId, index) =>
      prisma.question.update({
        where: { id: parseInt(questionId) },
        data: { position: index },
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: "Questions reordered successfully" });
  } catch (error) {
    console.error("Error reordering questions:", error);
    res.status(500).json({ error: "Failed to reorder questions" });
  }
});

export default router;
