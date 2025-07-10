"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Star, Clock, MapPin, Plus, Minus, Phone, Globe } from "lucide-react"
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
  isAvailable?: boolean
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
  website?: string
  coordinates?: { lat: number; lng: number }
  priceRange?: string
}

export default function RestaurantPage() {
  const params = useParams()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { addItem, items, updateQuantity } = useCart()

  useEffect(() => {
    fetchRestaurant()
  }, [params.id])

  const fetchRestaurant = async () => {
    try {
      setLoading(true)
      const slug = params.id as string

      console.log("🔍 Fetching restaurant with slug:", slug)

      // Try to fetch by slug first
      const response = await fetch(`/api/restaurants/slug/${encodeURIComponent(slug)}`)

      if (response.ok) {
        const data = await response.json()
        setRestaurant(data.restaurant)
        console.log("✅ Loaded restaurant:", data.restaurant.name)
      } else {
        console.error(`❌ Failed to fetch restaurant (${response.status}), using fallback`)
        setRestaurant(getSampleRestaurant(slug))
      }
    } catch (error) {
      console.error("❌ Error fetching restaurant:", error)
      setRestaurant(getSampleRestaurant(params.id as string))
    } finally {
      setLoading(false)
    }
  }

  const getItemQuantity = (itemId: string) => {
    const item = items.find((item) => item.id === itemId)
    return item ? item.quantity : 0
  }

  const handleAddToCart = (menuItem: MenuItem) => {
    const existingQuantity = getItemQuantity(menuItem.id)
    if (existingQuantity > 0) {
      updateQuantity(menuItem.id, existingQuantity + 1)
    } else {
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
  }

  const handleRemoveFromCart = (itemId: string) => {
    const existingQuantity = getItemQuantity(itemId)
    if (existingQuantity > 1) {
      updateQuantity(itemId, existingQuantity - 1)
    } else {
      updateQuantity(itemId, 0)
    }
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
    selectedCategory === "all"
      ? restaurant.menu.filter((item) => item.isAvailable !== false)
      : restaurant.menu.filter((item) => item.category === selectedCategory && item.isAvailable !== false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Restaurant Header */}
      <div className="relative">
        <img
          src={restaurant.image || "/placeholder.svg"}
          alt={restaurant.name}
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=800"
          }}
        />
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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                {restaurant.priceRange && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{restaurant.priceRange}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{restaurant.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
                {restaurant.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
              <Badge variant={restaurant.isOpen ? "default" : "secondary"} className="text-sm">
                {restaurant.isOpen ? "Open Now" : "Closed"}
              </Badge>
              <div className="text-sm text-gray-600">Delivery: ₹{restaurant.deliveryFee}</div>
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
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.isVegetarian && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      🌱 Veg
                    </Badge>
                  )}
                  {item.isSpicy && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      🌶️ Spicy
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
                <div className="text-xl font-bold text-orange-500">₹{item.price}</div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  {getItemQuantity(item.id) > 0 ? (
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleRemoveFromCart(item.id)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-medium w-8 text-center">{getItemQuantity(item.id)}</span>
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

        {/* Restaurant Info Footer */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">About {restaurant.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p className="mb-2">
                <strong>Cuisine:</strong> {restaurant.cuisine}
              </p>
              <p className="mb-2">
                <strong>Average Delivery Time:</strong> {restaurant.deliveryTime}
              </p>
              <p className="mb-2">
                <strong>Delivery Fee:</strong> ₹{restaurant.deliveryFee}
              </p>
            </div>
            <div>
              <p className="mb-2">
                <strong>Rating:</strong> {restaurant.rating.toFixed(1)} ⭐
              </p>
              <p className="mb-2">
                <strong>Status:</strong> {restaurant.isOpen ? "Open Now" : "Currently Closed"}
              </p>
              {restaurant.priceRange && (
                <p className="mb-2">
                  <strong>Price Range:</strong> {restaurant.priceRange}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fallback function for sample restaurant
function getSampleRestaurant(slug: string): Restaurant {
  // Extract name from slug
  const parts = slug.split("-")
  const name =
    parts
      .slice(0, -1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Sample Restaurant"

  return {
    id: `sample_${slug}`,
    name: name,
    cuisine: "Multi-cuisine",
    rating: 4.0,
    deliveryTime: "30-45 min",
    deliveryFee: 49,
    image: "/placeholder.svg?height=300&width=800",
    address: "Sample Address, City, State",
    phone: "+91 98765 43210",
    isOpen: true,
    priceRange: "₹₹",
    menu: [
      {
        id: "sample_1",
        name: "Special Dish",
        description: "Chef's special recommendation",
        price: 299,
        category: "specials",
        image: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: false,
        isAvailable: true,
      },
      {
        id: "sample_2",
        name: "Vegetarian Delight",
        description: "Fresh vegetarian option",
        price: 249,
        category: "vegetarian",
        image: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
      },
    ],
  }
}



