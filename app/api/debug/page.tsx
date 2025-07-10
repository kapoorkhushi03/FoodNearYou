import { NextResponse } from "next/server"
import { serverOrderStorage } from "@/lib/server-storage"

export async function GET() {
  try {
    let databaseStatus = "Not configured"
    let dbOrderCount = 0

    try {
      if (process.env.MONGODB_URI) {
        const { connectToDatabase } = await import("@/lib/mongodb")
        const { db } = await connectToDatabase()
        const count = await db.collection("orders").countDocuments()
        dbOrderCount = count
        databaseStatus = "Connected"
      }
    } catch (error) {
      databaseStatus = "Connection failed"
    }

    // Get all orders from server memory
    const allMemoryOrders = serverOrderStorage.getAllOrders()

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
    })
  } catch (error) {
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
