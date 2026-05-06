import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dashboardOverview } from "../controllers/dashboardController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireRole("admin", "manager"));
dashboardRouter.get("/overview", asyncHandler(dashboardOverview));
