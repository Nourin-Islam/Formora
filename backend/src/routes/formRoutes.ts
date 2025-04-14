import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { submitForm, getFormResults } from "../controllers/form.controller.ts";

const router = express.Router();

// Submit a form
router.post("/:templateId", authenticateUser, submitForm);

// Get form results
router.get("/:templateId/results", authenticateUser, getFormResults);

export default router;
