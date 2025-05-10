import express from "express";

import formRoutes from "./formRoutes";
import imagekitRoutes from "./imagekitRoutes";
import interactionsRouter from "./interactionsRouter";
import searchRoutes from "./searchRoutes";
import tagRoutes from "./tagsRoute";
import templateRoutes from "./templatesRoute";
import topicsRoute from "./topicsRoute";
import usersRoutes from "./usersRoutes";
import homeRoutes from "./homeRoutes";
import oddRoutes from "./oddRoutes";

import salesforceRoutes from "./salesforceRoutes";
import supportRoutes from "./supportRoutes";

const router = express.Router();

router.use("/home", homeRoutes);
router.use("/forms", formRoutes);
router.use("/imagekit", imagekitRoutes);
router.use("/interact", interactionsRouter);
router.use("/search", searchRoutes);
router.use("/tags", tagRoutes);
router.use("/templates", templateRoutes);
router.use("/topics", topicsRoute);
router.use("/users", usersRoutes);
router.use("/salesforce", salesforceRoutes);
router.use("/odoo", oddRoutes);
router.use("/support-ticket", supportRoutes);

export default router;
