import express from "express";
import { getAllSubmissionsForOdoo, getApiToken } from "../controllers/odoo.controller";
import { authenticateUser } from "../middleware/authenticateUser";

const router = express.Router();
// @ts-ignore
router.get("/", getAllSubmissionsForOdoo);
router.get("/get-api-token", authenticateUser, getApiToken);

export default router;
