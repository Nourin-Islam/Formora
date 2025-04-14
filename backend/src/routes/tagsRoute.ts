import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { requireAdmin } from "../middleware/auth.ts";
import { getAllTags, searchTags, getTagById, createTag, updateTag, deleteTag } from "../controllers/tags.controller.ts";

const router = express.Router();

router.get("/", getAllTags);
router.get("/search", searchTags);
router.get("/:id", getTagById);
router.post("/", authenticateUser, createTag);
router.patch("/:id", authenticateUser, requireAdmin, updateTag);
router.delete("/:id", authenticateUser, requireAdmin, deleteTag);

export default router;
