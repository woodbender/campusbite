"use client";

import { useEffect, useState } from "react";

type KitchenOrder = {
  id: number;
  status: "placed" | "preparing" | "ready";
  total: number;
  student_name: string;
  pickup_time: string;
  items: { name: string; quantity: number }[];
};

const columns = [
  { status: "placed" as const, title: "New orders", action: "Start preparing", next: "preparing" as const },
  { status: "preparing" as const, title: "Preparing", action: "Mark ready", next: "ready" as const },
  { status: "ready" as const, title: "Ready for pickup", action: "Collected", next: "collected" as const },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/kitchen", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load kitchen orders");
      setOrders(data.orders);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load kitchen orders");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, []);

  async function updateStatus(orderId: number, status: KitchenOrder["status"] | "collected") {
    try {
      const response = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update order");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <a href="/" className="text-sm text-slate-400 hover:text-white">← Student screen</a>
          <h1 className="mt-2 text-2xl font-bold">CampusBite kitchen</h1>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live
        </span>
      </header>
      {error && <p className="mb-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section key={column.status} className="rounded-xl bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{column.title}</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {orders.filter((order) => order.status === column.status).length}
              </span>
            </div>
            <div className="space-y-3">
              {orders.filter((order) => order.status === column.status).map((order) => (
                <article key={order.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Order #{order.id}</p>
                      <p className="text-sm text-slate-400">{order.student_name}</p>
                    </div>
                    <span className="text-sm font-medium text-amber-300">{order.pickup_time}</span>
                  </div>
                  <ul className="my-3 space-y-1 text-sm text-slate-300">
                    {order.items.map((item) => <li key={`${order.id}-${item.name}`}>{item.quantity}× {item.name}</li>)}
                  </ul>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-400">Rs {order.total}</span>
                    <button
                      onClick={() => updateStatus(order.id, column.next)}
                      className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      {column.action}
                    </button>
                  </div>
                </article>
              ))}
              {orders.filter((order) => order.status === column.status).length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">No orders</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
