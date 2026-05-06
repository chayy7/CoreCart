import { Schema, model, type InferSchemaType } from "mongoose";

const inventorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

inventorySchema.index({ productId: 1, storeId: 1 }, { unique: true });

export type InventoryDoc = InferSchemaType<typeof inventorySchema>;
export const Inventory = model("Inventory", inventorySchema);
