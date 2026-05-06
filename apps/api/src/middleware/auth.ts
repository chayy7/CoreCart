import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next({ statusCode: 401, message: "Unauthorized" });
  }

  try {
    const token = authHeader.replace("Bearer ", "").trim();
    req.user = verifyToken(token);
    return next();
  } catch {
    return next({ statusCode: 401, message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: Array<"admin" | "manager" | "cashier">) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next({ statusCode: 401, message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return next({ statusCode: 403, message: "Forbidden" });
    }
    return next();
  };
