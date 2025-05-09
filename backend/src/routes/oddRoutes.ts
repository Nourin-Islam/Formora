import express from "express";
import { getAllSubmissionsForOdoo } from "../controllers/odoo.controller";

const router = express.Router();
// @ts-ignore
router.get("/", getAllSubmissionsForOdoo);

export default router;
