import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_STUDENT_ID, formatSlot, relatedRow } from "../campusbite";

const getMenu = defineTool({
  name: "getMenu",
  description: "Use this when the user asks about today's menu, prices, vegetarian food, or available stock.",
  schema: z.object({
    category: z.enum(["meal", "snack", "drink", "sweet"]).optional().describe("Optional menu category"),
    veg_only: z.boolean().optional().describe("Only return vegetarian items"),
    max_price: z.number().int().positive().optional().describe("Only return items at or below this price in rupees"),
  }),
  run: async ({ category, veg_only, max_price }) => {
    let query = getSupabase()
      .from("menu_items")
      .select("id, name, category, price, is_veg, stock, description")
      .gt("stock", 0)
      .order("category")
      .order("price");
    if (category) query = query.eq("category", category);
    if (veg_only) query = query.eq("is_veg", true);
    if (max_price !== undefined) query = query.lte("price", max_price);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { items: data };
  },
});

const getWalletBalance = defineTool({
  name: "getWalletBalance",
  description: "Use this when the user asks for their wallet balance or before checking whether an order fits their budget.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("wallets")
      .select("name, balance")
      .eq("student_id", CURRENT_STUDENT_ID)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

const getPickupSlots = defineTool({
  name: "getPickupSlots",
  description: "Use this when the user asks when they can pick up an order or before choosing a pickup time.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("pickup_slots")
      .select("id, slot_time, capacity, booked")
      .order("slot_time");
    if (error) throw new Error(error.message);
    return {
      slots: data
        .map((slot) => ({ slot_id: slot.id, time: formatSlot(slot.slot_time), free: slot.capacity - slot.booked }))
        .filter((slot) => slot.free > 0),
    };
  },
});

const getMyOrders = defineTool({
  name: "getMyOrders",
  description: "Use this when the user asks about their recent orders or wants to cancel an order.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, status, total, pickup_slots(slot_time), order_items(quantity, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return {
      orders: data.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        pickup_time: formatSlot(relatedRow(order.pickup_slots)?.slot_time ?? ""),
        items: order.order_items.map((item) => ({
          name: relatedRow(item.menu_items)?.name ?? "Unknown item",
          quantity: item.quantity,
        })),
      })),
    };
  },
});

const placeOrder = defineTool({
  name: "placeOrder",
  description: "Use this when the user has confirmed food items and a pickup slot and wants to place the order.",
  writes: true,
  schema: z.object({
    items: z.array(z.object({
      menu_item_id: z.number().int().positive().describe("The menu item id returned by getMenu"),
      quantity: z.number().int().min(1).max(5).describe("Quantity, from 1 to 5"),
    })).min(1).describe("Menu item ids and quantities"),
    slot_id: z.number().int().positive().describe("The pickup slot id returned by getPickupSlots"),
  }),
  run: async ({ items, slot_id }) => {
    const { data, error } = await getSupabase().rpc("place_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_slot_id: slot_id,
      p_items: items,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const cancelOrder = defineTool({
  name: "cancelOrder",
  description: "Use this when the user wants to cancel one of their orders.",
  writes: true,
  schema: z.object({
    order_id: z.number().int().positive().describe("The order id returned by getMyOrders"),
  }),
  run: async ({ order_id }) => {
    const { data, error } = await getSupabase().rpc("cancel_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_order_id: order_id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

export const tools: AgentTool[] = [getMenu, getWalletBalance, getPickupSlots, getMyOrders, placeOrder, cancelOrder];
