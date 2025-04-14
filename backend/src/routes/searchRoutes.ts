import express from "express";
import { searchTemplates } from "../controllers/search.controller.ts";

const router = express.Router();

router.get("/", searchTemplates);

export default router;
