import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Inventory } from "../models/Inventory.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { safeRedisDel } from "../config/redis.js";
import { emitInventoryUpdate } from "./inventoryService.js";
import { calculateOrderTotal } from "./orderMath.js";

const buildOrderNo = () => `CC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const checkoutOrder = async (input: {
  storeId: string;
  cashierId: string;
  paymentMethod: "cash" | "card" | "upi";
  discount: number;
  tax: number;
  items: Array<{ productId: string; quantity: number }>;
  io: any;
}) => {
  const { storeId, cashierId, paymentMethod, discount, tax, items, io } = input;
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const orderItems: Array<{
    productId: mongoose.Types.ObjectId;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  if (!env.ENABLE_TRANSACTIONS) {
    const decremented: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw { statusCode: 404, message: `Product ${item.productId} not found` };
        }

        const updated = await Inventory.findOneAndUpdate(
          { storeId, productId: item.productId, quantity: { $gte: item.quantity } },
          {
            $inc: { quantity: -item.quantity },
            $set: { updatedBy: new mongoose.Types.ObjectId(cashierId) }
          },
          { new: true }
        );

        if (!updated) {
          throw { statusCode: 409, message: `Insufficient stock for ${product.name}` };
        }

        decremented.push({ productId: item.productId, quantity: item.quantity });
        orderItems.push({
          productId: new mongoose.Types.ObjectId(item.productId),
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal: Number((product.price * item.quantity).toFixed(2))
        });
      }

      const subtotal = Number(orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
      const total = calculateOrderTotal(subtotal, discount, tax);

      const order = await Order.create({
        orderNo: buildOrderNo(),
        channel: "pos",
        storeId,
        cashierId,
        items: orderItems,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        status: "paid"
      });

      await safeRedisDel(`inventory:store:${storeId}`);
      const updatedInventory = await Inventory.find({ storeId, productId: { $in: productIds } });
      for (const row of updatedInventory) {
        emitInventoryUpdate(io, {
          storeId,
          productId: String(row.productId),
          quantity: row.quantity,
          reorderLevel: row.reorderLevel,
          lowStock: row.quantity <= row.reorderLevel
        });
      }

      return order;
    } catch (error) {
      for (const item of decremented) {
        await Inventory.findOneAndUpdate(
          { storeId, productId: item.productId },
          {
            $inc: { quantity: item.quantity },
            $set: { updatedBy: new mongoose.Types.ObjectId(cashierId) }
          }
        );
      }
      throw error;
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw { statusCode: 404, message: `Product ${item.productId} not found` };
      }

      const inventory = await Inventory.findOne({ storeId, productId: item.productId }).session(session);
      if (!inventory || inventory.quantity < item.quantity) {
        throw { statusCode: 409, message: `Insufficient stock for ${product.name}` };
      }

      inventory.quantity -= item.quantity;
      inventory.updatedBy = new mongoose.Types.ObjectId(cashierId);
      await inventory.save({ session });

      orderItems.push({
        productId: new mongoose.Types.ObjectId(item.productId),
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal: Number((product.price * item.quantity).toFixed(2))
      });
    }

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const total = calculateOrderTotal(subtotal, discount, tax);

    const [order] = await Order.create(
      [
        {
          orderNo: buildOrderNo(),
          channel: "pos",
          storeId,
          cashierId,
          items: orderItems,
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          status: "paid"
        }
      ],
      { session }
    );

    await session.commitTransaction();

    await safeRedisDel(`inventory:store:${storeId}`);

    const updatedInventory = await Inventory.find({ storeId, productId: { $in: productIds } });
    for (const row of updatedInventory) {
      emitInventoryUpdate(io, {
        storeId,
        productId: String(row.productId),
        quantity: row.quantity,
        reorderLevel: row.reorderLevel,
        lowStock: row.quantity <= row.reorderLevel
      });
    }

    return order;
  } finally {
    session.endSession();
  }
};

export const refundOrder = async (input: {
  orderId: string;
  userId: string;
  io: any;
}) => {
  const { orderId, userId, io } = input;
  const order = await Order.findById(orderId);
  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  if (order.status === "refunded") {
    throw { statusCode: 409, message: "Order already refunded" };
  }

  const storeId = String(order.storeId);
  const restored: Array<{ productId: string; quantity: number }> = [];

  try {
    for (const item of order.items) {
      const updated = await Inventory.findOneAndUpdate(
        { storeId, productId: item.productId },
        {
          $inc: { quantity: item.quantity },
          $set: { updatedBy: new mongoose.Types.ObjectId(userId) },
          $setOnInsert: { reorderLevel: 5 }
        },
        { upsert: true, new: true }
      );

      restored.push({ productId: String(item.productId), quantity: item.quantity });

      emitInventoryUpdate(io, {
        storeId,
        productId: String(updated.productId),
        quantity: updated.quantity,
        reorderLevel: updated.reorderLevel,
        lowStock: updated.quantity <= updated.reorderLevel
      });
    }

    order.status = "refunded";
    await order.save();
    await safeRedisDel(`inventory:store:${storeId}`);
    return order;
  } catch (error) {
    for (const item of restored) {
      await Inventory.findOneAndUpdate(
        { storeId, productId: item.productId },
        {
          $inc: { quantity: -item.quantity },
          $set: { updatedBy: new mongoose.Types.ObjectId(userId) }
        }
      );
    }
    throw error;
  }
};
