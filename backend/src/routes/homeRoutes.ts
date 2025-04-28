import express from "express";
import { getLatestTemplates, getPopularTemplates, getTagCloud, getTopTopics } from "../controllers/home.controller";

const router = express.Router();

// @ts-ignore
router.get("/latest", getLatestTemplates);
// @ts-ignore
router.get("/popular", getPopularTemplates);
// @ts-ignore
router.get("/tags", getTagCloud);
// @ts-ignore
router.get("/topics", getTopTopics);

export default router;
