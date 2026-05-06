import { NavLink } from "react-router-dom";
import type { Store } from "../types";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/pos", label: "POS" },
  { to: "/products", label: "Products" },
  { to: "/inventory", label: "Inventory" },
  { to: "/orders", label: "Orders" },
  { to: "/dashboard", label: "Dashboard" }
];

export const Layout = ({
  children,
  stores,
  selectedStore,
  onStoreChange
}: {
  children: React.ReactNode;
  stores: Store[];
  selectedStore: string;
  onStoreChange: (storeId: string) => void;
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5efe0_0%,_#f7f7f9_40%,_#e8eef7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">CoreCart</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Retail Command</h1>
          <p className="mt-2 text-sm text-slate-600">Single place for POS, inventory, and live sync.</p>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-slate-900 p-4 text-slate-100">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Signed in as</p>
            <p className="mt-1 font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-300">{user?.role}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-900"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-3xl border border-white/70 bg-white/75 p-4 shadow-xl backdrop-blur md:p-6">
          <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Live Sync Enabled</p>
              <p className="text-lg font-bold">Everything updates in real time</p>
            </div>
            <select
              value={selectedStore}
              onChange={(event) => onStoreChange(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium"
            >
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white lg:hidden"
            >
              Logout
            </button>
          </header>
          <nav className="mb-4 flex flex-wrap gap-2 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
};
