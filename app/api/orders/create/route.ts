import { type NextRequest, NextResponse } from "next/server"
import { serverOrderStorage } from "@/lib/server-storage"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  restaurantId: string
  restaurantName: string
}

interface CreateOrderRequest {
  userId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  deliveryAddress: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId, items, subtotal, deliveryFee, tax, total, deliveryAddress }: CreateOrderRequest =
      await request.json()

    console.log("📝 Creating order for user:", userId)
    console.log("🛒 Order items:", items.length)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Calculate estimated delivery time
    const estimatedTime = calculateDeliveryTime()

    // Generate order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Create order object
    const newOrder = {
      _id: orderId,
      userId: userId,
      restaurantId: items[0].restaurantId,
      restaurantName: items[0].restaurantName,
      items: items.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      status: "confirmed",
      estimatedDeliveryTime: estimatedTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("💾 Saving order:", orderId)

    // Store in server memory
    serverOrderStorage.addOrder(userId, newOrder)

    // Try to save to database as well (if MongoDB is configured)
    try {
      if (process.env.MONGODB_URI) {
        const { connectToDatabase } = await import("@/lib/mongodb")
        const { db } = await connectToDatabase()
        await db.collection("orders").insertOne(newOrder)
        console.log("✅ Order saved to database successfully")
      }
    } catch (dbError) {
      console.error("⚠️ Database save failed, but order stored in memory:", dbError)
    }

    console.log("🎉 Order created successfully:", orderId)

    return NextResponse.json({
      message: "Order created successfully",
      orderId: orderId,
      estimatedDeliveryTime: estimatedTime,
    })
  } catch (error) {
    console.error("❌ Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

function calculateDeliveryTime(): string {
  // Generate random delivery time between 20-45 minutes
  const minTime = 20 + Math.floor(Math.random() * 15)
  const maxTime = minTime + 10 + Math.floor(Math.random() * 10)
  return `${minTime}-${maxTime} min`
}
