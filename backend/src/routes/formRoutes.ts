import express from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { getTemplateForFilling, getFilledForm, deleteFilledForm, getAllSubmissionsByTemplate, getAllMyResponses } from "../controllers/fillForm.controller";
import { submitForm } from "../controllers/submitForm.controller";

const router = express.Router();

// Get template for filling
router.get("/fill/:id", authenticateUser, getTemplateForFilling);

// Submit a filled form
router.post("/fill", authenticateUser, submitForm);

// Get a filled form
router.get("/view/:id", authenticateUser, getFilledForm);

// Delete a filled form
router.delete("/delete/:id", authenticateUser, deleteFilledForm);

// Get a filled form
// @ts-ignore
// router.get("/of-template/:id", authenticateUser, getAllFormByTemplate);
// @ts-ignore
router.get("/of-template/:id", authenticateUser, getAllSubmissionsByTemplate);
router.get("/my-responses", authenticateUser, getAllMyResponses);

export default router;
