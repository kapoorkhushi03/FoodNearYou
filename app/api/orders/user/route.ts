// app/api/orders/user/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { serverOrderStorage } from "@/lib/server-storage";

// 🚨 This line tells Next.js: DO NOT prerender statically
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ orders: [] }, { status: 400 });
    }

    console.log("🔍 Fetching orders for user:", userId);

    let orders = [];

    // 1️⃣ Try fetching from in-memory storage
    const memoryOrders = serverOrderStorage.getUserOrders(userId);
    if (memoryOrders.length > 0) {
      console.log(`📦 Found ${memoryOrders.length} orders in memory`);
      orders = memoryOrders.map(transformOrder);
      return NextResponse.json({ orders });
    }

    // 2️⃣ Try fetching from database if MONGODB_URI is configured
    if (process.env.MONGODB_URI) {
      try {
        const { connectToDatabase } = await import("@/lib/mongodb");
        const { db } = await connectToDatabase();

        const dbOrders = await db
          .collection("orders")
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray();

        if (dbOrders.length > 0) {
          console.log(`✅ Found ${dbOrders.length} orders in DB`);
          orders = dbOrders.map(transformOrder);
          return NextResponse.json({ orders });
        } else {
          console.log("📭 No orders found in DB for user:", userId);
        }
      } catch (dbError) {
        console.error("❌ DB Fetch Error:", dbError);
      }
    } else {
      console.warn("⚠️ No MONGODB_URI provided. Skipping DB fetch.");
    }

    // 3️⃣ Nothing found
    console.log("🕳️ No orders found in memory or DB");
    return NextResponse.json({ orders: [] });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}

// 🧩 Util to clean the order structure before returning to frontend
function transformOrder(order: any) {
  return {
    id: order._id,
    restaurantName: order.restaurantName,
    items: order.items.map((item: any) => ({
      id: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    total: order.total,
    status: order.status,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    deliveryAddress: order.deliveryAddress,
  };
}


