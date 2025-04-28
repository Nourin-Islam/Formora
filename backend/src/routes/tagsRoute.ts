import express from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { requireAdmin } from "../middleware/auth";
import { getAllTags, searchTags, createTag, updateTag, deleteTag } from "../controllers/tags.controller";

const router = express.Router();

router.get("/", getAllTags);
// @ts-ignore
router.get("/search", searchTags);
// @ts-ignore
router.post("/", authenticateUser, createTag);
router.patch("/:id", authenticateUser, requireAdmin, updateTag);

// router.get("/:id", getTagById);

router.delete("/:id", authenticateUser, requireAdmin, deleteTag);

export default router;
