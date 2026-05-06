import { Schema, model, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    channel: { type: String, enum: ["pos", "online"], default: "pos" },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cash", "card", "upi"], required: true },
    status: { type: String, enum: ["paid", "refunded"], default: "paid" }
  },
  { timestamps: true }
);

orderSchema.index({ storeId: 1, createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export const Order = model("Order", orderSchema);
