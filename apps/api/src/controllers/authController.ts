import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, storeId } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const usersCount = await User.countDocuments();
  let nextRole: "admin" | "manager" | "cashier" = role ?? "cashier";

  if (usersCount === 0 && !role) {
    nextRole = "admin";
  }

  if (usersCount > 0) {
    if (!req.user || req.user.role !== "admin") {
      nextRole = "cashier";
    }
  }

  const hashed = await hashPassword(password);
  const user = await User.create({ name, email, password: hashed, role: nextRole, storeId });

  const token = signToken({
    userId: String(user._id),
    role: user.role,
    storeId: user.storeId ? String(user.storeId) : undefined
  });

  res.status(201).json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId ? String(user.storeId) : null
    }
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({
    userId: String(user._id),
    role: user.role,
    storeId: user.storeId ? String(user.storeId) : undefined
  });

  res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId ? String(user.storeId) : null
    }
  });
};

export const me = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).select("name email role storeId");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId ? String(user.storeId) : null
  });
};
