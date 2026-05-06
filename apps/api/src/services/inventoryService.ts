import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Inventory } from "../models/Inventory.js";
import { Product } from "../models/Product.js";
import { safeRedisDel, safeRedisGet, safeRedisSet } from "../config/redis.js";

const storeCacheKey = (storeId: string) => `inventory:store:${storeId}`;

export type InventorySyncPayload = {
  storeId: string;
  productId: string;
  quantity: number;
  reorderLevel: number;
  lowStock: boolean;
};

export const emitInventoryUpdate = (io: any, payload: InventorySyncPayload) => {
  io.to(`store:${payload.storeId}`).emit("inventory:updated", payload);
};

export const getInventoryByStore = async (storeId: string) => {
  const key = storeCacheKey(storeId);
  const cached = await safeRedisGet(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const inventory = await Inventory.find({ storeId })
    .populate("productId", "sku name category price imageUrl")
    .lean();

  const shaped = inventory.map((row) => {
    const product = row.productId as unknown as {
      _id: string;
      sku: string;
      name: string;
      category: string;
      price: number;
      imageUrl?: string;
    };
    return {
      id: String(row._id),
      storeId: String(row.storeId),
      productId: String(product._id),
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl ?? "",
      quantity: row.quantity,
      reorderLevel: row.reorderLevel,
      lowStock: row.quantity <= row.reorderLevel
    };
  });

  await safeRedisSet(key, JSON.stringify(shaped), 15);
  return shaped;
};

export const adjustInventory = async (input: {
  storeId: string;
  productId: string;
  delta: number;
  reorderLevel?: number;
  userId: string;
  io: any;
}) => {
  const { storeId, productId, delta, reorderLevel, userId, io } = input;

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    throw { statusCode: 404, message: "Product not found" };
  }

  const inventory = await Inventory.findOne({ storeId, productId });
  const currentQty = inventory?.quantity ?? 0;
  const nextQty = currentQty + delta;
  if (nextQty < 0) {
    throw { statusCode: 409, message: "Insufficient stock for adjustment" };
  }

  const updated = await Inventory.findOneAndUpdate(
    { storeId, productId },
    {
      $set: {
        updatedBy: new mongoose.Types.ObjectId(userId),
        ...(typeof reorderLevel === "number" ? { reorderLevel } : {})
      },
      $inc: { quantity: delta }
    },
    { upsert: true, new: true }
  );

  await safeRedisDel(storeCacheKey(storeId));

  emitInventoryUpdate(io, {
    storeId,
    productId,
    quantity: updated.quantity,
    reorderLevel: updated.reorderLevel,
    lowStock: updated.quantity <= updated.reorderLevel
  });

  return updated;
};

export const transferInventory = async (input: {
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  userId: string;
  io: any;
}) => {
  const { productId, fromStoreId, toStoreId, quantity, userId, io } = input;
  if (fromStoreId === toStoreId) {
    throw { statusCode: 400, message: "Source and destination stores must differ" };
  }

  if (!env.ENABLE_TRANSACTIONS) {
    const fromUpdated = await Inventory.findOneAndUpdate(
      { storeId: fromStoreId, productId, quantity: { $gte: quantity } },
      {
        $inc: { quantity: -quantity },
        $set: { updatedBy: new mongoose.Types.ObjectId(userId) }
      },
      { new: true }
    );

    if (!fromUpdated) {
      throw { statusCode: 409, message: "Insufficient stock in source store" };
    }

    try {
      const toUpdated = await Inventory.findOneAndUpdate(
        { storeId: toStoreId, productId },
        {
          $inc: { quantity },
          $set: { updatedBy: new mongoose.Types.ObjectId(userId) },
          $setOnInsert: { reorderLevel: 5 }
        },
        { upsert: true, new: true }
      );

      await safeRedisDel(storeCacheKey(fromStoreId), storeCacheKey(toStoreId));

      emitInventoryUpdate(io, {
        storeId: fromStoreId,
        productId,
        quantity: fromUpdated.quantity,
        reorderLevel: fromUpdated.reorderLevel,
        lowStock: fromUpdated.quantity <= fromUpdated.reorderLevel
      });

      emitInventoryUpdate(io, {
        storeId: toStoreId,
        productId,
        quantity: toUpdated.quantity,
        reorderLevel: toUpdated.reorderLevel,
        lowStock: toUpdated.quantity <= toUpdated.reorderLevel
      });

      return { from: fromUpdated, to: toUpdated };
    } catch (error) {
      await Inventory.findOneAndUpdate(
        { storeId: fromStoreId, productId },
        {
          $inc: { quantity },
          $set: { updatedBy: new mongoose.Types.ObjectId(userId) }
        }
      );
      throw error;
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const from = await Inventory.findOne({ storeId: fromStoreId, productId }).session(session);
    if (!from || from.quantity < quantity) {
      throw { statusCode: 409, message: "Insufficient stock in source store" };
    }

    from.quantity -= quantity;
    from.updatedBy = new mongoose.Types.ObjectId(userId);
    await from.save({ session });

    const to = await Inventory.findOneAndUpdate(
      { storeId: toStoreId, productId },
      {
        $inc: { quantity },
        $set: {
          updatedBy: new mongoose.Types.ObjectId(userId)
        },
        $setOnInsert: { reorderLevel: 5 }
      },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();

    await safeRedisDel(storeCacheKey(fromStoreId), storeCacheKey(toStoreId));

    emitInventoryUpdate(io, {
      storeId: fromStoreId,
      productId,
      quantity: from.quantity,
      reorderLevel: from.reorderLevel,
      lowStock: from.quantity <= from.reorderLevel
    });

    emitInventoryUpdate(io, {
      storeId: toStoreId,
      productId,
      quantity: to.quantity,
      reorderLevel: to.reorderLevel,
      lowStock: to.quantity <= to.reorderLevel
    });

    return { from, to };
  } finally {
    session.endSession();
  }
};
