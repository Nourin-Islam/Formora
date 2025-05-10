import { Router } from "express";
import { submitTicket } from "../controllers/supportController";

const router = Router();
router.post("/", submitTicket);
export default router;
