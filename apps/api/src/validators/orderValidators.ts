import { z } from "zod";

export const checkoutSchema = z.object({
  body: z.object({
    storeId: z.string().min(1),
    paymentMethod: z.enum(["cash", "card", "upi"]),
    discount: z.number().nonnegative().default(0),
    tax: z.number().nonnegative().default(0),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive()
        })
      )
      .min(1)
  })
});

export const refundSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});
