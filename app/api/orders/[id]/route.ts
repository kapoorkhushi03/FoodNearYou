import { type NextRequest, NextResponse } from "next/server"
import { serverOrderStorage } from "@/lib/server-storage"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("🔍 Fetching order:", id)

    // First try server memory storage
    const foundOrder = serverOrderStorage.getOrder(id)

    if (foundOrder) {
      console.log("📦 Found order in server memory")
      const transformedOrder = {
        id: foundOrder._id,
        restaurantName: foundOrder.restaurantName,
        items: foundOrder.items.map((item: any) => ({
          id: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: foundOrder.total,
        status: foundOrder.status,
        estimatedDeliveryTime: foundOrder.estimatedDeliveryTime,
        deliveryAddress: foundOrder.deliveryAddress,
        restaurantPhone: "+91 98765 43210",
        createdAt: foundOrder.createdAt.toISOString(),
      }
      return NextResponse.json({ order: transformedOrder })
    }

    // Try database as fallback (if MongoDB is configured)
    try {
      if (process.env.MONGODB_URI) {
        const { connectToDatabase } = await import("@/lib/mongodb")
        const { db } = await connectToDatabase()
        const order = await db.collection("orders").findOne({ _id: id })

        if (order) {
          console.log("✅ Found order in database")
          const transformedOrder = {
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
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            deliveryAddress: order.deliveryAddress,
            restaurantPhone: "+91 98765 43210",
            createdAt: order.createdAt.toISOString(),
          }
          return NextResponse.json({ order: transformedOrder })
        }
      }
    } catch (dbError) {
      console.log("⚠️ Database query failed:", dbError)
    }

    // Fallback to sample order
    console.log("📋 Using sample order")
    const sampleOrder = {
      id: id,
      restaurantName: "Pizza Palace",
      items: [
        { id: "1", name: "Margherita Pizza", quantity: 1, price: 299 },
        { id: "2", name: "Caesar Salad", quantity: 1, price: 199 },
      ],
      total: 547,
      status: "confirmed",
      estimatedDeliveryTime: "25-35 min",
      deliveryAddress: "123 Main St, City, State",
      restaurantPhone: "+91 98765 43210",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ order: sampleOrder })
  } catch (error) {
    console.error("❌ Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}
