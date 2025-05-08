import express from "express";
import { salesforceSyncHandler } from "../controllers/salesforce.controller";
import { authenticateUser } from "../middleware/authenticateUser";

const router = express.Router();

router.post("/sync", authenticateUser, salesforceSyncHandler);

export default router;
