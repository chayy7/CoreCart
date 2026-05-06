import type { Request, Response } from "express";
import { Order } from "../models/Order.js";
import { checkoutOrder, refundOrder } from "../services/orderService.js";

export const checkout = async (req: Request, res: Response) => {
  const io = req.app.get("io");
  const bodyStoreId = String(req.body.storeId || "");
  const storeId = req.user?.role === "cashier" ? String(req.user.storeId || "") : bodyStoreId;
  if (!storeId) {
    return res.status(400).json({ message: "storeId is required" });
  }

  const order = await checkoutOrder({
    ...req.body,
    storeId,
    cashierId: req.user!.userId,
    io
  });

  res.status(201).json(order);
};

export const listOrders = async (req: Request, res: Response) => {
  const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  const storeId =
    req.user?.role === "cashier"
      ? String(req.user.storeId || "")
      : String(requestedStoreId || req.user?.storeId || "");
  const filter: Record<string, unknown> = {};
  if (storeId) {
    filter.storeId = storeId;
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json(orders);
};

export const refund = async (req: Request, res: Response) => {
  const io = req.app.get("io");
  const order = await refundOrder({
    orderId: String(req.params.id),
    userId: req.user!.userId,
    io
  });

  res.json(order);
};
