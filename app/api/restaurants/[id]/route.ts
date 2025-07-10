import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { type Restaurant, type MenuItem, transformRestaurant, transformMenuItem } from "@/models/Restaurant"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { db } = await connectToDatabase()

    // Fetch restaurant details
    const restaurant = await db.collection<Restaurant>("restaurants").findOne({ _id: new ObjectId(id) })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Fetch menu items for this restaurant
    const menuItems = await db
      .collection<MenuItem>("menu_items")
      .find({ restaurantId: new ObjectId(id), isAvailable: true })
      .toArray()

    const transformedRestaurant = transformRestaurant(restaurant)
    transformedRestaurant.menu = menuItems.map(transformMenuItem)

    return NextResponse.json({ restaurant: transformedRestaurant })
  } catch (error) {
    console.error("Error fetching restaurant:", error)

    // Fallback to sample data with Indian prices
    const sampleRestaurant = {
      id: params.id,
      name: "Pizza Palace",
      cuisine: "Italian",
      rating: 4.5,
      deliveryTime: "25-35 min",
      deliveryFee: 49,
      image: "/placeholder.svg?height=300&width=800",
      address: "MG Road, Bangalore, Karnataka 560001",
      phone: "+91 80 1234 5678",
      isOpen: true,
      coordinates: { lat: 12.9716, lng: 77.5946 },
      priceRange: "₹₹",
      menu: [
        {
          id: "1",
          name: "Margherita Pizza",
          description: "Fresh tomatoes, mozzarella, basil, and olive oil",
          price: 299,
          image: "/placeholder.svg?height=200&width=300",
          category: "pizza",
          isVegetarian: true,
          isSpicy: false,
          isAvailable: true,
        },
        {
          id: "2",
          name: "Pepperoni Pizza",
          description: "Classic pepperoni with mozzarella cheese",
          price: 399,
          image: "/placeholder.svg?height=200&width=300",
          category: "pizza",
          isVegetarian: false,
          isSpicy: false,
          isAvailable: true,
        },
        {
          id: "3",
          name: "Caesar Salad",
          description: "Romaine lettuce, parmesan, croutons, caesar dressing",
          price: 199,
          image: "/placeholder.svg?height=200&width=300",
          category: "salads",
          isVegetarian: true,
          isSpicy: false,
          isAvailable: true,
        },
        {
          id: "4",
          name: "Chicken Alfredo",
          description: "Grilled chicken with creamy alfredo sauce over fettuccine",
          price: 449,
          image: "/placeholder.svg?height=200&width=300",
          category: "pasta",
          isVegetarian: false,
          isSpicy: false,
          isAvailable: true,
        },
        {
          id: "5",
          name: "Tiramisu",
          description: "Classic Italian dessert with coffee and mascarpone",
          price: 149,
          image: "/placeholder.svg?height=200&width=300",
          category: "desserts",
          isVegetarian: true,
          isSpicy: false,
          isAvailable: true,
        },
        {
          id: "6",
          name: "Spicy Arrabbiata",
          description: "Penne pasta with spicy tomato sauce and red peppers",
          price: 349,
          image: "/placeholder.svg?height=200&width=300",
          category: "pasta",
          isVegetarian: true,
          isSpicy: true,
          isAvailable: true,
        },
      ],
    }

    return NextResponse.json({ restaurant: sampleRestaurant })
  }
}
