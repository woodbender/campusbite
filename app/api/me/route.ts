import { NextResponse } from "next/server";
import { CURRENT_STUDENT_ID, formatSlot, relatedRow } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabase();
  const [walletResult, ordersResult] = await Promise.all([
    supabase.from("wallets").select("name, balance").eq("student_id", CURRENT_STUDENT_ID).single(),
    supabase
      .from("orders")
      .select("id, status, total, pickup_slots(slot_time), order_items(quantity, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (walletResult.error || ordersResult.error) {
    const message = walletResult.error?.message ?? ordersResult.error?.message ?? "Could not load student data";
    console.error("[GET /api/me]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  const orders = ordersResult.data.map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    pickup_time: formatSlot(relatedRow(order.pickup_slots)?.slot_time ?? ""),
    items: order.order_items.map((item) => ({
      name: relatedRow(item.menu_items)?.name ?? "Unknown item",
      quantity: item.quantity,
    })),
  }));
  return NextResponse.json({ student: walletResult.data, orders });
}
