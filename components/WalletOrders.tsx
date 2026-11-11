"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  status: string;
  total: number;
  pickup_time: string;
  items: { name: string; quantity: number }[];
};

type StudentData = {
  student: { name: string; balance: number };
  orders: Order[];
};

const statusStyles: Record<string, string> = {
  placed: "bg-sky-100 text-sky-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  collected: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function WalletOrders({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<StudentData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load orders");
        if (active) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load orders");
      }
    }
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <div className="rounded-xl bg-slate-900 text-white shadow-sm">
      <div className="border-b border-slate-700 px-4 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Wallet</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{data?.student.name ?? "Student"}</h2>
            <p className="text-sm text-slate-400">Available balance</p>
          </div>
          <p className="text-2xl font-bold">Rs {data?.student.balance ?? "—"}</p>
        </div>
      </div>
      <div className="px-4 py-4">
        <h3 className="font-semibold">My orders today</h3>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {!error && data?.orders.length === 0 && <p className="mt-3 text-sm text-slate-400">No orders yet.</p>}
        <ul className="mt-3 divide-y divide-slate-700">
          {data?.orders.map((order) => (
            <li key={order.id} className="py-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">Order #{order.id}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${statusStyles[order.status] ?? statusStyles.placed}`}>
                  {order.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")} · pickup {order.pickup_time}
              </p>
              <p className="mt-1 text-sm font-medium">Rs {order.total}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
