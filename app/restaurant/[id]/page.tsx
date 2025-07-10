"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Star, Clock, MapPin, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { Header } from "@/components/header"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isVegetarian?: boolean
  isSpicy?: boolean
}

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  image: string
  address: string
  phone: string
  isOpen: boolean
  menu: MenuItem[]
}

export default function RestaurantPage() {
  const params = useParams()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { addItem, items } = useCart()

  useEffect(() => {
    fetchRestaurant()
  }, [params.id])

  const fetchRestaurant = async () => {
    try {
      setLoading(true)

      // First try to fetch from our database
      let response = await fetch(`/api/restaurants/${params.id}`)

      // If not found in database, try Google Places API
      if (!response.ok && params.id.startsWith("ChIJ")) {
        response = await fetch(`/api/restaurants/google/${params.id}`)
      }

      if (response.ok) {
        const data = await response.json()
        setRestaurant(data.restaurant)
      } else {
        // Fallback to sample data
        setRestaurant(sampleRestaurant)
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error)
      setRestaurant(sampleRestaurant)
    } finally {
      setLoading(false)
    }
  }

  const getItemQuantity = (itemId: string) => {
    const item = items.find((item) => item.id === itemId)
    return item ? item.quantity : 0
  }

  const handleAddToCart = (menuItem: MenuItem) => {
    addItem({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      image: menuItem.image,
      restaurantId: restaurant!.id,
      restaurantName: restaurant!.name,
      quantity: 1,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant not found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const categories = ["all", ...Array.from(new Set(restaurant.menu.map((item) => item.category)))]
  const filteredMenu =
    selectedCategory === "all" ? restaurant.menu : restaurant.menu.filter((item) => item.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Restaurant Header */}
      <div className="relative">
        <img src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} className="w-full h-64 object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Restaurant Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{restaurant.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.address}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              <Badge variant={restaurant.isOpen ? "default" : "secondary"} className="text-sm">
                {restaurant.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.isVegetarian && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Veg
                    </Badge>
                  )}
                  {item.isSpicy && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Spicy
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
                <div className="text-xl font-bold text-orange-500">₹{item.price.toFixed(0)}</div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  {getItemQuantity(item.id) > 0 ? (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Remove item logic would go here
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-medium">{getItemQuantity(item.id)}</span>
                      <Button variant="outline" size="sm" onClick={() => handleAddToCart(item)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleAddToCart(item)}
                      disabled={!restaurant.isOpen}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMenu.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Sample restaurant data
const sampleRestaurant: Restaurant = {
  id: "1",
  name: "Pizza Palace",
  cuisine: "Italian",
  rating: 4.5,
  deliveryTime: "25-35 min",
  deliveryFee: 49,
  image: "/placeholder.svg?height=300&width=800",
  address: "MG Road, Bangalore, Karnataka 560001",
  phone: "+91 80 1234 5678",
  isOpen: true,
  menu: [
    {
      id: "1",
      name: "Margherita Pizza",
      description: "Fresh tomatoes, mozzarella, basil, and olive oil",
      price: 299,
      image: "/placeholder.svg?height=200&width=300",
      category: "pizza",
      isVegetarian: true,
    },
    {
      id: "2",
      name: "Pepperoni Pizza",
      description: "Classic pepperoni with mozzarella cheese",
      price: 399,
      image: "/placeholder.svg?height=200&width=300",
      category: "pizza",
    },
    {
      id: "3",
      name: "Caesar Salad",
      description: "Romaine lettuce, parmesan, croutons, caesar dressing",
      price: 199,
      image: "/placeholder.svg?height=200&width=300",
      category: "salads",
      isVegetarian: true,
    },
    {
      id: "4",
      name: "Chicken Alfredo",
      description: "Grilled chicken with creamy alfredo sauce over fettuccine",
      price: 449,
      image: "/placeholder.svg?height=200&width=300",
      category: "pasta",
    },
    {
      id: "5",
      name: "Tiramisu",
      description: "Classic Italian dessert with coffee and mascarpone",
      price: 149,
      image: "/placeholder.svg?height=200&width=300",
      category: "desserts",
      isVegetarian: true,
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
    },
  ],
}
