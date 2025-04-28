// usersRoute.ts
import express from "express";
import { requireAdmin } from "../middleware/auth.ts";
import { authenticateUser } from "../middleware/authenticateUser.ts";
import { getAllUsers, updateUser, deleteUser } from "../controllers/users.controller.ts";

const router = express.Router();

// Attach user before all routes
router.use(authenticateUser);

router.get("/", getAllUsers);
router.patch("/:id", requireAdmin, updateUser);
router.delete("/:id", requireAdmin, deleteUser);

// router.get("/search", searchUsers);

// router.get("/preferences/:id", getUserPreferences);
// router.patch("/preferences/:id", setUserPreferences);

export default router;
