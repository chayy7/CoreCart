import { Schema, model, type InferSchemaType } from "mongoose";

const variantSchema = new Schema(
  {
    size: { type: String, default: "" },
    color: { type: String, default: "" }
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    price: { type: Number, required: true, min: 0 },
    barcode: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    variants: { type: [variantSchema], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", sku: "text", category: "text" });

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
