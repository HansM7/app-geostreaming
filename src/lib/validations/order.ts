import { z } from "zod";

const orderSchema = z.object({
  ref_id: z.number().optional().nullable(),
  role: z.enum(["USER", "DISTRIBUTOR"]),
  quantity: z.number().min(1),
  user_id: z.number(),
  account_id: z.number(),
});

export function validateOrder(orderInfo: unknown) {
  const parseResut = orderSchema.safeParse(orderInfo);
  if (!parseResut.success) {
    throw new Error("Invalid Order info");
  }
  return parseResut.data;
}

const updateOrder = orderSchema.extend({
  id: z.number(),
});

export function validateUpdateOrder(orderInfo: unknown) {
  const parseResut = updateOrder.safeParse(orderInfo);
  if (!parseResut.success) {
    throw new Error("Invalid Order info");
  }
  return parseResut.data;
}
