import express from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { getTemplateForFilling, getTemplateForEditing, getFilledForm, deleteFilledForm, getAllSubmissionsByTemplate, getAllMyResponses } from "../controllers/fillForm.controller";
import { submitForm, updateFilledForm } from "../controllers/submitForm.controller";

const router = express.Router();

// Get template for authenticated user for filling
router.get("/check/:id", getTemplateForFilling);

// Get template for authenticated user for filling
router.get("/fill/:id", authenticateUser, getTemplateForFilling);

router.get("/edit/:id", authenticateUser, getTemplateForEditing);

// Submit a filled form
router.post("/fill", authenticateUser, submitForm);
// update a filled form
router.put("/fill/:id", authenticateUser, updateFilledForm);

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
