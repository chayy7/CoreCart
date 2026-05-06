import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listStores } from "../controllers/storeController.js";
import { requireAuth } from "../middleware/auth.js";

export const storeRouter = Router();

storeRouter.get("/", requireAuth, asyncHandler(listStores));
