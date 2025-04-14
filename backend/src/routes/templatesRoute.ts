import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from "../controllers/template.controller.ts";

const router = express.Router();

router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.post("/", authenticateUser, createTemplate);
router.put("/:id", authenticateUser, updateTemplate);
router.delete("/:id", authenticateUser, deleteTemplate);

export default router;
