import type { Request, Response } from "express";
import { Product } from "../models/Product.js";

export const listProducts = async (req: Request, res: Response) => {
  const { q } = req.query;
  const filter: Record<string, unknown> = { isActive: true };

  if (typeof q === "string" && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  res.json(products);
};

export const createProduct = async (req: Request, res: Response) => {
  const created = await Product.create(req.body);
  res.status(201).json(created);
};

export const updateProduct = async (req: Request, res: Response) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(updated);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const deleted = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!deleted) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json({ message: "Product archived" });
};
