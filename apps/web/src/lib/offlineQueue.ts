const QUEUE_KEY = "corecart_offline_queue";

export type OfflineOrder = {
  storeId: string;
  paymentMethod: "cash" | "card" | "upi";
  discount: number;
  tax: number;
  items: Array<{ productId: string; quantity: number }>;
};

export const getQueue = (): OfflineOrder[] => {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as OfflineOrder[];
  } catch {
    return [];
  }
};

export const pushQueue = (order: OfflineOrder) => {
  const current = getQueue();
  const next = [...current, order];
  localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  return next;
};

export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};
