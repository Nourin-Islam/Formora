import express from "express";
import { getImageKitAuth } from "../controllers/imagekit.controller";

const router = express.Router();

// Route to generate auth params for frontend
router.get("/auth", getImageKitAuth);

export default router;
