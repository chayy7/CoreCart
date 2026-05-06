import { z } from "zod";

export const adjustInventorySchema = z.object({
  body: z.object({
    storeId: z.string().min(1),
    productId: z.string().min(1),
    delta: z.number(),
    reorderLevel: z.number().nonnegative().optional()
  })
});

export const transferInventorySchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    fromStoreId: z.string().min(1),
    toStoreId: z.string().min(1),
    quantity: z.number().int().positive()
  })
});
