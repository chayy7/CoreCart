import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { inr } from "../lib/format";
import type { DashboardOverview } from "../types";
import { StatCard } from "../components/StatCard";

export const DashboardPage = ({
  storeId,
  canView
}: {
  storeId: string;
  canView: boolean;
}) => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    if (!canView) {
      return;
    }
    api
      .get("/dashboard/overview", { params: { storeId } })
      .then((response) => setOverview(response.data as DashboardOverview))
      .catch(() => setOverview(null));
  }, [storeId, canView]);

  if (!canView) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold">Dashboard analytics is available for Manager/Admin roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Revenue" value={inr(overview?.revenue ?? 0)} tone="accent" />
        <StatCard label="Orders" value={String(overview?.ordersCount ?? 0)} />
        <StatCard label="Low Stock Items" value={String(overview?.lowStockCount ?? 0)} tone="warn" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Top Selling Products</p>
        <div className="mt-3 space-y-2">
          {(overview?.topProducts ?? []).map((item) => (
            <div key={item._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span>{item.name}</span>
              <strong>{item.qty} sold</strong>
            </div>
          ))}
          {!overview?.topProducts?.length && <p className="text-sm text-slate-500">No sales yet.</p>}
        </div>
      </div>
    </div>
  );
};
