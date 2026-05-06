import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { inr } from "../lib/format";
import { getQueue, pushQueue } from "../lib/offlineQueue";
import type { CartItem, InventoryRow } from "../types";

const fallbackImage =
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80";
const backupImage = "https://picsum.photos/seed/corecart-pos/1200/900";

export const POSPage = ({
  inventory,
  storeId,
  dataError,
  reload
}: {
  inventory: InventoryRow[];
  storeId: string;
  dataError?: string;
  reload: () => Promise<void>;
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(inventory.map((item) => item.category))).sort()],
    [inventory]
  );

  const visibleInventory = useMemo(() => {
    const key = search.trim().toLowerCase();
    return inventory.filter((item) => {
      const categoryOk = activeCategory === "All" || item.category === activeCategory;
      const textOk =
        !key ||
        item.name.toLowerCase().includes(key) ||
        item.sku.toLowerCase().includes(key) ||
        item.category.toLowerCase().includes(key);
      return categoryOk && textOk;
    });
  }, [inventory, search, activeCategory]);

  const showEmptyState = !visibleInventory.length;

  const addToCart = (product: InventoryRow) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.quantity),
                available: product.quantity
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.productId,
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          imageUrl: product.imageUrl,
          available: product.quantity
        }
      ];
    });
  };

  const updateQty = (productId: string, nextQty: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, Math.min(nextQty, item.available)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - discount + tax);

  const queueCount = getQueue().length;

  const checkout = async () => {
    if (!cart.length) {
      setMessage("Add items before checkout.");
      return;
    }

    const payload = {
      storeId,
      paymentMethod,
      discount,
      tax,
      items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    };

    const online = navigator.onLine;
    if (!online) {
      pushQueue(payload);
      setCart([]);
      setMessage("Offline mode: order queued for sync.");
      return;
    }

    try {
      await api.post("/orders/checkout", payload);
      setMessage("Payment captured and inventory synced.");
      setCart([]);
      setDiscount(0);
      setTax(0);
      await reload();
    } catch {
      pushQueue(payload);
      setMessage("Network issue: order moved to offline queue.");
    }
  };

  return (
    <div className="grid gap-5 h-screen overflow-hidden xl:grid-cols-[1.25fr_0.75fr]">
      <section className="overflow-y-auto">
        <div className="mb-5 overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-amber-50 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">POS Billing</h2>
              <p className="rounded-full bg-white px-4 py-1 text-xs font-bold text-slate-700 shadow-sm">Offline Queue: {queueCount}</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name, SKU, category"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <div className="hide-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    activeCategory === category
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleInventory.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => addToCart(item)}
              disabled={item.quantity < 1}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              <img
                src={item.imageUrl || fallbackImage}
                alt={item.name}
                className="h-52 w-full object-cover"
                loading="lazy"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = backupImage;
                }}
              />
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">{item.category}</p>
                <p className="mt-1 text-lg font-black leading-tight">{item.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-2xl font-black">{inr(item.price)}</p>
                  <p className={`text-xs font-bold ${item.lowStock ? "text-red-600" : "text-emerald-700"}`}>
                    Stock: {item.quantity}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {showEmptyState && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600 md:col-span-2">
              {dataError ? (
                <p className="font-semibold text-red-600">Could not load POS items: {dataError}</p>
              ) : (
                <p className="font-semibold">
                  No items found for this store/filter. Run `npm run seed` and refresh.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm overflow-y-auto flex flex-col">
        <h3 className="text-lg font-black">Cart Summary</h3>
        <div className="mt-3 space-y-3 overflow-y-auto max-h-[48vh]">
          {cart.map((item) => (
            <div key={item.productId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <img
                  src={item.imageUrl || fallbackImage}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg object-cover"
                  loading="lazy"
                  onError={(event) => {
                    const target = event.currentTarget;
                    target.onerror = null;
                    target.src = backupImage;
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.sku}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  type="number"
                  value={item.quantity}
                  min={1}
                  max={item.available}
                  onChange={(event) => updateQty(item.productId, Number(event.target.value))}
                />
                <p className="text-sm font-semibold">{inr(item.unitPrice * item.quantity)}</p>
                <button
                  type="button"
                  className="ml-auto text-xs font-bold text-red-600"
                  onClick={() => removeItem(item.productId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {!cart.length && <p className="text-sm text-slate-500">No items in cart yet.</p>}
        </div>

        <div className="mt-4 space-y-3">
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as "cash" | "card" | "upi")}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
          </select>

          <div className="space-y-1 text-sm">
            <p className="flex items-center justify-between"><span>Subtotal</span><strong>{inr(subtotal)}</strong></p>
            <p className="flex items-center justify-between"><span>Total</span><strong className="text-lg">{inr(total)}</strong></p>
          </div>

          <button
            type="button"
            onClick={checkout}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
          >
            Complete Checkout
          </button>

          {message && <p className="text-sm font-medium text-cyan-700">{message}</p>}
        </div>
      </aside>
    </div>
  );
};
