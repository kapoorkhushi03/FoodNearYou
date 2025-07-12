import { NextResponse } from "next/server";
import { serverOrderStorage } from "@/lib/server-storage";

export const dynamic = "force-dynamic"; // 💡 Ensure this route isn't statically built

export async function GET() {
  try {
    let databaseStatus = "Not configured";
    let dbOrderCount = 0;

    // Check DB connection only if env is set
    try {
      if (process.env.MONGODB_URI) {
        const { connectToDatabase } = await import("@/lib/mongodb");
        const { db } = await connectToDatabase();
        dbOrderCount = await db.collection("orders").countDocuments();
        databaseStatus = "Connected";
      }
    } catch (error) {
      databaseStatus = "Connection failed";
    }

    const allMemoryOrders = serverOrderStorage.getAllOrders();

    return NextResponse.json({
      memoryOrderCount: allMemoryOrders.length,
      databaseStatus,
      dbOrderCount,
      memoryOrders: allMemoryOrders.map((order) => ({
        id: order._id,
        userId: order.userId,
        restaurant: order.restaurantName,
        total: order.total,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}
