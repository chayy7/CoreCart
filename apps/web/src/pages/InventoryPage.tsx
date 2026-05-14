import { useMemo, useState } from "react";
import { api } from "../lib/api";
import type { InventoryRow } from "../types";
import { inr } from "../lib/format";

const fallbackImage =
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80";
const backupImage = "https://picsum.photos/seed/corecart-inventory/1200/900";

export const InventoryPage = ({
  inventory,
  storeId,
  canManage,
  reload
}: {
  inventory: InventoryRow[];
  storeId: string;
  canManage: boolean;
  reload: () => Promise<void>;
}) => {
  const [selected, setSelected] = useState<string>("");
  const [delta, setDelta] = useState<number>(1);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const lowStocks = useMemo(() => inventory.filter((item) => item.lowStock), [inventory]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(inventory.map((item) => item.category))).sort()],
    [inventory]
  );

  const visibleInventory = useMemo(
    () => inventory.filter((item) => (activeCategory === "All" ? true : item.category === activeCategory)),
    [inventory, activeCategory]
  );

  const adjust = async () => {
    if (!selected) {
      setMessage("Select a product first.");
      return;
    }

    try {
      await api.patch("/inventory/adjust", {
        storeId,
        productId: selected,
        delta
      });
      setMessage("Inventory adjusted.");
      await reload();
    } catch {
      setMessage("Adjustment failed.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Low Stock Alerts</p>
        <p className="mt-2 text-sm font-medium">
          {lowStocks.length ? lowStocks.map((item) => `${item.name} (${item.quantity})`).join(", ") : "No low stock items."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setActiveCategory(item)}
              className={`inline-flex shrink-0 rounded-full px-4 py-1.5 text-xs font-bold ${
                activeCategory === item
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {canManage && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">Select product</option>
            {visibleInventory.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            type="number"
            value={delta}
            onChange={(event) => setDelta(Number(event.target.value))}
          />

          <button
            type="button"
            onClick={adjust}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Adjust Stock
          </button>

          <p className="self-center text-sm font-medium text-slate-600">{message}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleInventory.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src={item.imageUrl || fallbackImage}
              alt={item.name}
              className="h-48 w-full object-cover"
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                target.onerror = null;
                target.src = backupImage;
              }}
            />
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">{item.category}</p>
              <h3 className="mt-1 text-lg font-black">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.sku}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-100 p-2">
                  <p className="text-slate-500">Price</p>
                  <p className="font-bold text-slate-900">{inr(item.price)}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-2">
                  <p className="text-slate-500">Reorder</p>
                  <p className="font-bold text-slate-900">{item.reorderLevel}</p>
                </div>
                <div className={`rounded-lg p-2 ${item.lowStock ? "bg-red-100" : "bg-emerald-100"}`}>
                  <p className="text-slate-500">Stock</p>
                  <p className={`font-bold ${item.lowStock ? "text-red-700" : "text-emerald-700"}`}>{item.quantity}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
