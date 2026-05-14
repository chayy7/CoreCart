import { useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Product } from "../types";
import { inr } from "../lib/format";

const fallbackImage =
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80";
const backupImage = "https://picsum.photos/seed/corecart-products/1200/900";

export const ProductsPage = ({
  products,
  canManage,
  reload
}: {
  products: Product[];
  canManage: boolean;
  reload: () => Promise<void>;
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("General");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [message, setMessage] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((item) => item.category))).sort()],
    [products]
  );

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return products.filter((item) => {
      const categoryOk = activeCategory === "All" || item.category === activeCategory;
      const textOk =
        !key ||
        item.name.toLowerCase().includes(key) ||
        item.sku.toLowerCase().includes(key) ||
        item.category.toLowerCase().includes(key);
      return categoryOk && textOk;
    });
  }, [products, q, activeCategory]);

  const createProduct = async () => {
    if (!name || !sku || price <= 0) {
      setMessage("Name, SKU and price are required.");
      return;
    }

    try {
      await api.post("/products", {
        name,
        sku,
        category,
        description,
        price,
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {})
      });
      setName("");
      setSku("");
      setCategory("General");
      setPrice(0);
      setDescription("");
      setImageUrl("");
      setMessage("Product created.");
      await reload();
    } catch {
      setMessage("Could not create product (check unique SKU or valid image URL).");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-black tracking-tight">Product Catalog</h2>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by name, SKU, category"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:max-w-lg"
          />
          <div className="hide-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setActiveCategory(item)}
                className={`inline-flex shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  activeCategory === item
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-6">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Product name" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="SKU" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={price || ""} onChange={(event) => setPrice(Number(event.target.value))} placeholder="Price" type="number" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://image-url" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={createProduct} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white xl:col-span-2">Add Product</button>
        </div>
      )}

      {message && <p className="text-sm font-semibold text-cyan-700">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl">
            <img
              src={item.imageUrl || fallbackImage}
              alt={item.name}
              className="h-56 w-full object-cover"
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                target.onerror = null;
                target.src = backupImage;
              }}
            />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">{item.category}</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.sku}</p>
              {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-2xl font-black">{inr(item.price)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!filtered.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No products found for current filters.
        </div>
      )}
    </div>
  );
};
