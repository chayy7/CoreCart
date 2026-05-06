import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthPayload = {
  userId: string;
  role: "admin" | "manager" | "cashier";
  storeId?: string;
};

const signOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
};

export const signToken = (payload: AuthPayload) =>
  jwt.sign(payload, env.JWT_SECRET as Secret, signOptions);

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as AuthPayload;
