import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  adjustInventoryController,
  listInventory,
  transferInventoryController
} from "../controllers/inventoryController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adjustInventorySchema, transferInventorySchema } from "../validators/inventoryValidators.js";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);
inventoryRouter.get("/", asyncHandler(listInventory));
inventoryRouter.patch(
  "/adjust",
  requireRole("admin", "manager"),
  validate(adjustInventorySchema),
  asyncHandler(adjustInventoryController)
);
inventoryRouter.post(
  "/transfer",
  requireRole("admin", "manager"),
  validate(transferInventorySchema),
  asyncHandler(transferInventoryController)
);
