"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, Star, Clock, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  image: string
  distance: number
  isOpen: boolean
  priceRange: string
  address: string
  slug?: string
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to a sample location if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.006 })
        },
      )
    }
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchNearbyRestaurants()
    }
  }, [userLocation])

  const createRestaurantSlug = (name: string, id: string): string => {
    // Create a URL-friendly slug from restaurant name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim()

    // Add a short hash from the ID to ensure uniqueness
    const hash = id.slice(-6)
    return `${baseSlug}-${hash}`
  }

  const fetchNearbyRestaurants = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/restaurants/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radius: 5000, // 5km radius
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Add slugs to restaurants
        const restaurantsWithSlugs = data.restaurants.map((restaurant: Restaurant) => ({
          ...restaurant,
          slug: createRestaurantSlug(restaurant.name, restaurant.id),
        }))
        setRestaurants(restaurantsWithSlugs)
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error)
      // Fallback to sample data with slugs
      const sampleWithSlugs = sampleRestaurants.map((restaurant) => ({
        ...restaurant,
        slug: createRestaurantSlug(restaurant.name, restaurant.id),
      }))
      setRestaurants(sampleWithSlugs)
    } finally {
      setLoading(false)
    }
  }

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Delicious food, delivered fast</h1>
            <p className="text-xl mb-8">
              Discover the best restaurants near you and get your favorite meals delivered in minutes
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search restaurants or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Location Display */}
      {userLocation && (
        <section className="bg-white border-b py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>Delivering to your location</span>
            </div>
          </div>
        </section>
      )}

      {/* Restaurants Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Restaurants near you</h2>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Link key={restaurant.id} href={`/restaurant/${restaurant.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative">
                      <img
                        src={restaurant.image || "/placeholder.svg"}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                      {!restaurant.isOpen && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                          <span className="text-white font-semibold">Closed</span>
                        </div>
                      )}
                      {restaurant.id.startsWith("ChIJ") && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            📍 Live
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                          <CardDescription>{restaurant.cuisine}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {restaurant.rating}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {restaurant.address}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {restaurant.deliveryTime}
                          </div>
                          <div>₹{restaurant.deliveryFee} delivery</div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">
                            {restaurant.distance ? `${restaurant.distance.toFixed(1)} km away` : "Nearby"}
                          </span>
                          <span className="text-sm font-medium">{restaurant.priceRange}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found matching your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// Sample data for fallback
const sampleRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Pizza Palace",
    cuisine: "Italian",
    rating: 4.5,
    deliveryTime: "25-35 min",
    deliveryFee: 49,
    image: "/placeholder.svg?height=200&width=300",
    distance: 1.2,
    isOpen: true,
    priceRange: "₹₹",
    address: "MG Road, Bangalore, Karnataka 560001",
  },
  {
    id: "2",
    name: "Burger Junction",
    cuisine: "American",
    rating: 4.2,
    deliveryTime: "20-30 min",
    deliveryFee: 29,
    image: "/placeholder.svg?height=200&width=300",
    distance: 0.8,
    isOpen: true,
    priceRange: "₹",
    address: "Connaught Place, New Delhi, Delhi 110001",
  },
  {
    id: "3",
    name: "Sushi Zen",
    cuisine: "Japanese",
    rating: 4.7,
    deliveryTime: "30-45 min",
    deliveryFee: 79,
    image: "/placeholder.svg?height=200&width=300",
    distance: 2.1,
    isOpen: true,
    priceRange: "₹₹₹",
    address: "Bandra West, Mumbai, Maharashtra 400050",
  },
  {
    id: "4",
    name: "Taco Fiesta",
    cuisine: "Mexican",
    rating: 4.3,
    deliveryTime: "15-25 min",
    deliveryFee: 25,
    image: "/placeholder.svg?height=200&width=300",
    distance: 0.5,
    isOpen: false,
    priceRange: "₹",
    address: "Koramangala, Bangalore, Karnataka 560034",
  },
]
