import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body, params: req.params, query: req.query });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next({ statusCode: 400, message: "Validation failed", details: error.flatten() });
    }
    return next(error);
  }
};
