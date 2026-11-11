import { NextResponse } from "next/server";
import { z } from "zod";
import { formatSlot, relatedRow } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statusSchema = z.object({
  order_id: z.number().int().positive(),
  status: z.enum(["placed", "preparing", "ready", "collected"]),
});

export async function GET() {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, status, total, created_at, wallets(name), pickup_slots(slot_time), order_items(quantity, price, menu_items(name))")
    .in("status", ["placed", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[GET /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const orders = data.map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    student_name: relatedRow(order.wallets)?.name ?? "Unknown student",
    pickup_time: formatSlot(relatedRow(order.pickup_slots)?.slot_time ?? ""),
    items: order.order_items.map((item) => ({
      name: relatedRow(item.menu_items)?.name ?? "Unknown item",
      quantity: item.quantity,
      price: item.price,
    })),
  }));
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order status", details: parsed.error.issues }, { status: 400 });
  }
  const { order_id, status } = parsed.data;
  const { data: order, error: readError } = await getSupabase()
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .single();
  if (readError) {
    console.error("[POST /api/kitchen]", readError.message);
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  const nextStatus: Record<string, string> = {
    placed: "preparing",
    preparing: "ready",
    ready: "collected",
  };
  if (nextStatus[order.status] !== status) {
    return NextResponse.json({ error: `Cannot change order from ${order.status} to ${status}` }, { status: 409 });
  }
  const { data, error } = await getSupabase()
    .from("orders")
    .update({ status })
    .eq("id", order_id)
    .select("id, status")
    .single();
  if (error) {
    console.error("[POST /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
