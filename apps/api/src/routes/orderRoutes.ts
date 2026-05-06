import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkout, listOrders, refund } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema, refundSchema } from "../validators/orderValidators.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);
orderRouter.get("/", requireRole("admin", "manager", "cashier"), asyncHandler(listOrders));
orderRouter.post("/checkout", requireRole("admin", "manager", "cashier"), validate(checkoutSchema), asyncHandler(checkout));
orderRouter.post("/:id/refund", requireRole("admin", "manager"), validate(refundSchema), asyncHandler(refund));
