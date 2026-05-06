export type Role = "admin" | "manager" | "cashier";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId: string | null;
};

export type Store = {
  _id: string;
  name: string;
  code: string;
  address: string;
};

export type Product = {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
};

export type InventoryRow = {
  id: string;
  storeId: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  reorderLevel: number;
  lowStock: boolean;
};

export type CartItem = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  available: number;
};

export type DashboardOverview = {
  revenue: number;
  ordersCount: number;
  lowStockCount: number;
  topProducts: Array<{
    _id: string;
    name: string;
    qty: number;
  }>;
};

export type Order = {
  _id: string;
  orderNo: string;
  storeId: string;
  cashierId: string;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi";
  status: "paid" | "refunded";
  createdAt: string;
};
