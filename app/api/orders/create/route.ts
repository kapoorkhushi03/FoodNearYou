import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import type { Order } from "@/models/Order"

export async function POST(request: NextRequest) {
  try {
    const { items, subtotal, deliveryFee, tax, total, deliveryAddress, userId } = await request.json()

    // Calculate estimated delivery time using Google Maps Distance Matrix API
    const estimatedTime = await calculateDeliveryTime(deliveryAddress)

    const { db } = await connectToDatabase()

    const newOrder: Order = {
      userId: new ObjectId(userId),
      restaurantId: new ObjectId(items[0]?.restaurantId),
      restaurantName: items[0]?.restaurantName,
      items: items.map((item: any) => ({
        menuItemId: new ObjectId(item.id),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      status: "pending",
      estimatedDeliveryTime: estimatedTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Order>("orders").insertOne(newOrder)

    return NextResponse.json({
      message: "Order created successfully",
      orderId: result.insertedId.toString(),
      estimatedDeliveryTime: estimatedTime,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

async function calculateDeliveryTime(deliveryAddress: string): Promise<string> {
  try {
    // In production, use Google Maps Distance Matrix API
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/distancematrix/json?origins=restaurant_address&destinations=${encodeURIComponent(deliveryAddress)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    // )

    // For demo purposes, return a random time between 20-45 minutes
    const minTime = 20 + Math.floor(Math.random() * 25)
    const maxTime = minTime + 10

    return `${minTime}-${maxTime} min`
  } catch (error) {
    console.error("Error calculating delivery time:", error)
    return "30-45 min"
  }
}
