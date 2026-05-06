import type { Request, Response } from "express";
import { Inventory } from "../models/Inventory.js";
import { Order } from "../models/Order.js";

export const dashboardOverview = async (req: Request, res: Response) => {
  const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId : "";
  const storeId =
    req.user?.role === "admin"
      ? String(requestedStoreId || req.user?.storeId || "")
      : String(req.user?.storeId || requestedStoreId || "");
  const storeFilter: Record<string, unknown> = storeId ? { storeId } : {};

  const [salesAgg, ordersCount, lowStockCount, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: storeFilter },
      { $group: { _id: null, revenue: { $sum: "$total" } } }
    ]),
    Order.countDocuments(storeFilter),
    Inventory.countDocuments({
      ...storeFilter,
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    }),
    Order.aggregate([
      { $match: storeFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          qty: { $sum: "$items.quantity" }
        }
      },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    revenue: salesAgg[0]?.revenue ?? 0,
    ordersCount,
    lowStockCount,
    topProducts
  });
};
