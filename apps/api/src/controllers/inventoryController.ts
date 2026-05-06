import type { Request, Response } from "express";
import { adjustInventory, getInventoryByStore, transferInventory } from "../services/inventoryService.js";

export const listInventory = async (req: Request, res: Response) => {
  const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  const storeId =
    req.user?.role === "cashier"
      ? String(req.user.storeId || "")
      : String(requestedStoreId || req.user?.storeId || "");

  if (!storeId) {
    return res.status(400).json({ message: "storeId is required" });
  }

  const rows = await getInventoryByStore(storeId);
  res.json(rows);
};

export const adjustInventoryController = async (req: Request, res: Response) => {
  const io = req.app.get("io");
  const updated = await adjustInventory({
    ...req.body,
    userId: req.user!.userId,
    io
  });
  res.json(updated);
};

export const transferInventoryController = async (req: Request, res: Response) => {
  const io = req.app.get("io");
  const moved = await transferInventory({
    ...req.body,
    userId: req.user!.userId,
    io
  });

  res.json({
    message: "Transfer completed",
    from: { quantity: moved.from.quantity, storeId: String(moved.from.storeId) },
    to: { quantity: moved.to.quantity, storeId: String(moved.to.storeId) }
  });
};
