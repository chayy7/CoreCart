import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1),
    name: z.string().min(2),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().nonnegative(),
    barcode: z.string().optional(),
    imageUrl: z.string().url().optional(),
    variants: z
      .array(
        z.object({
          size: z.string().optional(),
          color: z.string().optional()
        })
      )
      .optional()
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().nonnegative().optional(),
    barcode: z.string().optional(),
    imageUrl: z.string().url().optional(),
    variants: z
      .array(
        z.object({
          size: z.string().optional(),
          color: z.string().optional()
        })
      )
      .optional(),
    isActive: z.boolean().optional()
  })
});
