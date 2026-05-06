import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, me, register } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));
authRouter.post("/login", validate(loginSchema), asyncHandler(login));
authRouter.get("/me", requireAuth, asyncHandler(me));
