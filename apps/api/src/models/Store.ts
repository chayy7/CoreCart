import { Schema, model, type InferSchemaType } from "mongoose";

const storeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    address: { type: String, default: "" }
  },
  { timestamps: true }
);

export type StoreDoc = InferSchemaType<typeof storeSchema>;
export const Store = model("Store", storeSchema);
