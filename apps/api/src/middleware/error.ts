import type { NextFunction, Request, Response } from "express";

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next({ statusCode: 404, message: "Route not found" });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode =
    typeof error === "object" && error && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;

  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : "Internal server error";

  const details =
    typeof error === "object" && error && "details" in error
      ? (error as { details?: unknown }).details
      : undefined;

  res.status(statusCode).json({ message, details });
};
