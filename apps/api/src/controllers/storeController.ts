import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Store } from "../models/Store.js";

export const listStores = async (req: Request, res: Response) => {
  const filter =
    req.user?.role === "cashier" && req.user.storeId
      ? { _id: new mongoose.Types.ObjectId(req.user.storeId) }
      : {};

  const stores = await Store.find(filter).sort({ name: 1 }).lean();
  res.json(stores);
};
