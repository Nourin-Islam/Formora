import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { getTemplateForFilling, submitForm, getForm, deleteFilledForm } from "../controllers/fillForm.controller.ts";

const router = express.Router();

// Get template for filling
router.get("/fill/:id", authenticateUser, getTemplateForFilling);

// Submit a filled form
router.post("/fill", authenticateUser, submitForm);

// Get a filled form
router.get("/view/:id", authenticateUser, getForm);

// Delete a filled form
router.delete("/delete/:id", authenticateUser, deleteFilledForm);

export default router;
