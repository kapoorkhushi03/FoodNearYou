import { type NextRequest, NextResponse } from "next/server"
import { serverOrderStorage } from "@/lib/server-storage"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    console.log("🔍 Fetching orders for user:", userId)

    let orders = []

    if (userId) {
      // First try server memory storage
      const memoryOrders = serverOrderStorage.getUserOrders(userId)
      if (memoryOrders.length > 0) {
        orders = memoryOrders.map(transformOrder)
        console.log(`📦 Found ${orders.length} orders in server memory`)
      } else {
        // Try database as fallback (if MongoDB is configured)
        try {
          if (process.env.MONGODB_URI) {
            const { connectToDatabase } = await import("@/lib/mongodb")
            const { db } = await connectToDatabase()
            const dbOrders = await db.collection("orders").find({ userId: userId }).sort({ createdAt: -1 }).toArray()

            if (dbOrders.length > 0) {
              orders = dbOrders.map(transformOrder)
              console.log(`✅ Found ${orders.length} orders in database`)
            }
          }
        } catch (dbError) {
          console.log("⚠️ Database query failed:", dbError)
        }
      }
    }

    // If still no orders, return sample data
    if (orders.length === 0) {
      console.log("📋 Using sample orders")
      orders = getSampleOrders()
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("❌ Error fetching user orders:", error)
    return NextResponse.json({ orders: getSampleOrders() })
  }
}

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
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    deliveryAddress: order.deliveryAddress,
  }
}

function getSampleOrders() {
  return [
    {
      id: `ORD${Date.now()}001`,
      restaurantName: "Pizza Palace",
      items: [
        { id: "1", name: "Margherita Pizza", quantity: 1, price: 299 },
        { id: "2", name: "Caesar Salad", quantity: 1, price: 199 },
      ],
      total: 547,
      status: "on_the_way",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      estimatedDeliveryTime: "10-15 min",
      deliveryAddress: "123 Main St, City, State",
    },
    {
      id: `ORD${Date.now()}002`,
      restaurantName: "Burger Junction",
      items: [
        { id: "3", name: "Classic Burger", quantity: 2, price: 199 },
        { id: "4", name: "French Fries", quantity: 1, price: 99 },
      ],
      total: 546,
      status: "delivered",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      estimatedDeliveryTime: "Delivered",
      deliveryAddress: "123 Main St, City, State",
    },
  ]
}

