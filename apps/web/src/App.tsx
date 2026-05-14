import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import { clearQueue, getQueue } from "./lib/offlineQueue";
import { socket } from "./lib/socket";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { POSPage } from "./pages/POSPage";
import { ProductsPage } from "./pages/ProductsPage";
import type { InventoryRow, Order, Product, Store } from "./types";

const PrivateApp = () => {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataError, setDataError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootstrapTimedOut, setBootstrapTimedOut] = useState(false);

  const canManageInventory = user?.role === "admin" || user?.role === "manager";
  const canViewDashboard = user?.role === "admin" || user?.role === "manager";
  const canManageProducts = user?.role === "admin" || user?.role === "manager";
  const canRefundOrders = user?.role === "admin" || user?.role === "manager";

  const loadStores = async () => {
    try {
      const response = await api.get("/stores");
      const nextStores = response.data as Store[];
      setStores(nextStores);
      setDataError("");

      if (!nextStores.length) {
        setSelectedStore("");
        setDataError("No stores found for this account. Login again after seeding.");
        return;
      }

      const userStoreExists = !!user?.storeId && nextStores.some((store) => store._id === user.storeId);
      const currentSelectionExists = !!selectedStore && nextStores.some((store) => store._id === selectedStore);

      const nextSelectedStore =
        userStoreExists
          ? String(user!.storeId)
          : currentSelectionExists
            ? selectedStore
            : nextStores[0]._id;

      setSelectedStore(nextSelectedStore);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          logout();
          return;
        }
        setDataError((error.response?.data as { message?: string } | undefined)?.message || "Failed to load stores.");
      } else {
        setDataError("Failed to load stores.");
      }
      setStores([]);
      setSelectedStore("");
    } finally {
      setBootstrapping(false);
    }
  };

  const loadInventory = async (storeId: string) => {
    if (!storeId) {
      return;
    }
    const response = await api.get("/inventory", { params: { storeId } });
    setInventory(response.data as InventoryRow[]);
  };

  const loadProducts = async () => {
    const response = await api.get("/products");
    setProducts(response.data as Product[]);
  };

  const loadOrders = async (storeId: string) => {
    if (!storeId) {
      return;
    }
    const response = await api.get("/orders", { params: { storeId } });
    setOrders(response.data as Order[]);
  };

  const loadDataForStore = async (storeId: string) => {
    if (!storeId) {
      return;
    }

    const results = await Promise.allSettled([
      loadInventory(storeId),
      loadOrders(storeId),
      loadProducts()
    ]);

    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;

    if (!rejected) {
      setDataError("");
      return;
    }

    const reason = rejected.reason;
    if (isAxiosError(reason)) {
      setDataError((reason.response?.data as { message?: string } | undefined)?.message || "Failed to load inventory data.");
    } else {
      setDataError("Failed to load inventory data.");
    }
  };

  useEffect(() => {
    loadStores().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!bootstrapping) {
      setBootstrapTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setBootstrapTimedOut(true);
      setBootstrapping(false);
      if (!dataError) {
        setDataError("App bootstrap timed out. Please retry.");
      }
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [bootstrapping, dataError]);

  useEffect(() => {
    loadDataForStore(selectedStore).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  useEffect(() => {
    if (!selectedStore) {
      return;
    }

    socket.connect();
    socket.emit("store:join", selectedStore);

    socket.on("inventory:updated", (payload: { productId: string; quantity: number; lowStock: boolean }) => {
      setInventory((prev) =>
        prev.map((item) =>
          item.productId === payload.productId
            ? { ...item, quantity: payload.quantity, lowStock: payload.lowStock }
            : item
        )
      );
    });

    return () => {
      socket.off("inventory:updated");
    };
  }, [selectedStore]);

  useEffect(() => {
    const flushQueue = async () => {
      const queue = getQueue();
      if (!queue.length) {
        return;
      }

      for (const order of queue) {
        await api.post("/orders/checkout", order);
      }

      clearQueue();
      await loadDataForStore(selectedStore);
    };

    const onOnline = () => {
      flushQueue().catch(() => undefined);
    };

    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const layoutReady = useMemo(() => stores.length > 0 && !!selectedStore, [stores, selectedStore]);

  if (bootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center text-sm font-semibold">
        Loading CoreCart...
      </div>
    );
  }

  if (!layoutReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Unable to load store data</h2>
          <p className="mt-2 text-sm text-slate-700">
            {dataError || "No stores found. Run seed data and try again."}
          </p>
          {bootstrapTimedOut && (
            <p className="mt-2 text-xs text-amber-700">
              The initial API request did not finish in time.
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout stores={stores} selectedStore={selectedStore} onStoreChange={setSelectedStore}>
      <Routes>
        <Route
          path="/pos"
          element={
            <POSPage
              inventory={inventory}
              storeId={selectedStore}
              dataError={dataError}
              reload={() => loadDataForStore(selectedStore)}
            />
          }
        />
        <Route
          path="/products"
          element={
            <ProductsPage
              products={products}
              canManage={canManageProducts}
              reload={loadProducts}
            />
          }
        />
        <Route
          path="/inventory"
          element={
            <InventoryPage
              inventory={inventory}
              storeId={selectedStore}
              canManage={canManageInventory}
              reload={() => loadDataForStore(selectedStore)}
            />
          }
        />
        <Route
          path="/orders"
          element={<OrdersPage orders={orders} canRefund={canRefundOrders} reload={() => loadDataForStore(selectedStore)} />}
        />
        <Route path="/dashboard" element={<DashboardPage storeId={selectedStore} canView={canViewDashboard} />} />
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </Layout>
  );
};

export const App = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }

    if (user && location.pathname === "/login") {
      navigate("/pos", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={user ? <PrivateApp /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};
