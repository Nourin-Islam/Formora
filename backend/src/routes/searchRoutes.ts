import express from "express";
import { searchTemplates } from "../controllers/search.controller";

const router = express.Router();
// @ts-ignore
router.get("/", searchTemplates);

export default router;
