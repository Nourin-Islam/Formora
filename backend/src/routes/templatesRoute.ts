import express from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from "../controllers/template.controller";

const router = express.Router();

// @ts-ignore
router.get("/:id", authenticateUser, getTemplateById);

// @ts-ignore
router.put("/:id", authenticateUser, updateTemplate);

// @ts-ignore
router.delete("/:id", authenticateUser, deleteTemplate);

// @ts-ignore
router.get("/", authenticateUser, getAllTemplates);

// @ts-ignore
router.post("/", authenticateUser, createTemplate);

export default router;
