"use client";

import { useEffect, useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  category: "meal" | "snack" | "drink" | "sweet";
  price: number;
  is_veg: boolean;
  stock: number;
};

const labels = { meal: "Meals", snack: "Snacks", sweet: "Sweets", drink: "Drinks" };
const order = ["meal", "snack", "sweet", "drink"] as const;

export default function MenuPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load menu");
        if (active) {
          setItems(result.items);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load menu");
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
    <div className="mt-4 rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Today&apos;s menu</h2>
        <p className="text-xs text-slate-500">Live stock from the canteen.</p>
      </div>
      {error && <p className="p-4 text-sm text-red-600">{error}</p>}
      <div className="p-4">
        {order.map((category) => {
          const categoryItems = items.filter((item) => item.category === category);
          return (
            <section key={category} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labels[category]}</h3>
              <ul className="divide-y divide-slate-100">
                {categoryItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className={item.stock === 0 ? "text-slate-400 line-through" : ""}>{item.name}</span>
                      </p>
                      <p className="pl-4 text-xs text-slate-500">
                        {item.stock === 0 ? "Sold out" : item.stock <= 3 ? `Only ${item.stock} left` : `${item.stock} available`}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium">Rs {item.price}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
