import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { getQuestionsByTemplate, getQuestionById, createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from "../controllers/question.controller.ts";

const router = express.Router();

// Public routes
router.get("/template/:templateId", getQuestionsByTemplate);
router.get("/:id", getQuestionById);

// Protected routes
router.post("/", authenticateUser, createQuestion);
router.put("/:id", authenticateUser, updateQuestion);
router.delete("/:id", authenticateUser, deleteQuestion);
router.post("/reorder", authenticateUser, reorderQuestions);

export default router;
