import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from "../controllers/template.controller.ts";

const router = express.Router();
// @ts-ignore
router.get("/", getAllTemplates);
// @ts-ignore
router.get("/:id", getTemplateById);
// @ts-ignore
router.post("/", authenticateUser, createTemplate);
// @ts-ignore
router.put("/:id", authenticateUser, updateTemplate);
// @ts-ignore
router.delete("/:id", authenticateUser, deleteTemplate);

export default router;
