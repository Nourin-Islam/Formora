// File: routes/index.js

import express from "express";
import { authenticate, getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from "../api/templates";

import { getQuestionsByTemplate, getQuestionById, createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from "../api/questions";

const router = express.Router();

// Authentication middleware for routes that require it
router.use(["/api/templates/create", "/api/templates/:id/update", "/api/templates/:id/delete", "/api/questions/create", "/api/questions/:id/update", "/api/questions/:id/delete", "/api/questions/reorder"], authenticate);

// Template routes
router.get("/api/templates", getTemplates);
router.get("/api/templates/:id", getTemplateById);
router.post("/api/templates", authenticate, createTemplate);
router.put("/api/templates/:id", authenticate, updateTemplate);
router.delete("/api/templates/:id", authenticate, deleteTemplate);

// Question routes
router.get("/api/questions/template/:templateId", getQuestionsByTemplate);
router.get("/api/questions/:id", getQuestionById);
router.post("/api/questions", authenticate, createQuestion);
router.put("/api/questions/:id", authenticate, updateQuestion);
router.delete("/api/questions/:id", authenticate, deleteQuestion);
router.post("/api/questions/reorder", authenticate, reorderQuestions);

export default router;
