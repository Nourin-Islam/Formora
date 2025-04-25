import express from "express";

import formRoutes from "./formRoutes.ts";
import imagekitRoutes from "./imagekitRoutes.ts";
import interactionsRouter from "./interactionsRouter.ts";
import questionRoutes from "./questionRoutes.ts";
import searchRoutes from "./searchRoutes.ts";
import tagRoutes from "./tagsRoute.ts";
import templateRoutes from "./templatesRoute.ts";
import topicsRoute from "./topicsRoute.ts";
import usersRoutes from "./usersRoutes.ts";
import homeRoutes from "./homeRoutes.ts";

const router = express.Router();

router.use("/home", homeRoutes);
router.use("/forms", formRoutes);
router.use("/imagekit", imagekitRoutes);
router.use("/interact", interactionsRouter);
router.use("/questions", questionRoutes);
router.use("/search", searchRoutes);
router.use("/tags", tagRoutes);
router.use("/templates", templateRoutes);
router.use("/topics", topicsRoute);
router.use("/users", usersRoutes);

export default router;
