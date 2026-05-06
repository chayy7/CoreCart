import { useState } from "react";
import { api } from "../lib/api";
import { inr } from "../lib/format";
import type { Order } from "../types";

export const OrdersPage = ({
  orders,
  canRefund,
  reload
}: {
  orders: Order[];
  canRefund: boolean;
  reload: () => Promise<void>;
}) => {
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const refund = async (orderId: string) => {
    try {
      setBusyId(orderId);
      await api.post(`/orders/${orderId}/refund`);
      setMessage("Order refunded and stock restored.");
      await reload();
    } catch {
      setMessage("Refund failed.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-black">Orders</h2>
        <p className="text-sm font-medium text-slate-600">Recent 100 orders</p>
      </div>

      {message && <p className="text-sm font-semibold text-cyan-700">{message}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-600">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{order.orderNo}</td>
                <td className="px-4 py-3">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                <td className="px-4 py-3">{inr(order.total)}</td>
                <td className="px-4 py-3 uppercase">{order.paymentMethod}</td>
                <td className={`px-4 py-3 font-semibold ${order.status === "refunded" ? "text-orange-600" : "text-emerald-700"}`}>
                  {order.status}
                </td>
                <td className="px-4 py-3">
                  {canRefund && order.status === "paid" ? (
                    <button
                      type="button"
                      disabled={busyId === order._id}
                      onClick={() => refund(order._id)}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === order._id ? "Refunding..." : "Refund"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={6}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
