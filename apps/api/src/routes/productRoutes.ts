import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createProduct, deleteProduct, listProducts, updateProduct } from "../controllers/productController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidators.js";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.get("/", asyncHandler(listProducts));
productRouter.post("/", requireRole("admin", "manager"), validate(createProductSchema), asyncHandler(createProduct));
productRouter.patch("/:id", requireRole("admin", "manager"), validate(updateProductSchema), asyncHandler(updateProduct));
productRouter.delete("/:id", requireRole("admin", "manager"), asyncHandler(deleteProduct));
