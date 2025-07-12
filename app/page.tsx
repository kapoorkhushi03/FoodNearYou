"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, Star, Clock, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const { user } = useAuth()

  useEffect(() => {
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
          // Fallback to a default location (e.g., Bangalore)
          setUserLocation({ lat: 12.9716, lng: 77.5946 })
        },
      )
    }
  }, [])

  useEffect(() => {
    if (userLocation) {
      // Reset restaurants and pagination when location changes
      setRestaurants([])
      setNextPageToken(null)
      setHasMore(true)
      fetchNearbyRestaurants(null) // null means first page
    }
  }, [userLocation])

  const createRestaurantSlug = (name: string, id: string): string => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
    const hash = id.slice(-6)
    return `${baseSlug}-${hash}`
  }

  const fetchNearbyRestaurants = async (pageToken: string | null) => {
    try {
      if (pageToken) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const response = await fetch("/api/restaurants/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radius: 5000,
          pagetoken: pageToken, // Use pagetoken instead of page
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const restaurantsWithSlugs = data.restaurants.map((restaurant: Restaurant) => ({
          ...restaurant,
          slug: createRestaurantSlug(restaurant.name, restaurant.id),
        }))

        if (pageToken) {
          // Append to existing restaurants for pagination
          setRestaurants((prev) => [...prev, ...restaurantsWithSlugs])
        } else {
          // Replace restaurants for first page
          setRestaurants(restaurantsWithSlugs)
        }

        setNextPageToken(data.nextPageToken)
        setHasMore(data.hasMore)
      } else {
        // Fallback to sample data
        if (!pageToken) {
          const restaurantsWithSlugs = sampleRestaurants.map((restaurant) => ({
            ...restaurant,
            slug: createRestaurantSlug(restaurant.name, restaurant.id),
          }))
          setRestaurants(restaurantsWithSlugs)
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error)
      if (!pageToken) {
        const restaurantsWithSlugs = sampleRestaurants.map((restaurant) => ({
          ...restaurant,
          slug: createRestaurantSlug(restaurant.name, restaurant.id),
        }))
        setRestaurants(restaurantsWithSlugs)
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      fetchNearbyRestaurants(nextPageToken)
    }
  }

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      (restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (distanceFilter === null || restaurant.distance <= distanceFilter),
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

      {/* Location and Filter Display */}
      <section className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>Delivering to your location</span>
            </div>
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filters
                  {distanceFilter && (
                    <Badge variant="secondary" className="ml-1">
                      {distanceFilter}km
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Restaurants</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Maximum Distance</Label>
                    <div className="space-y-3">
                      <Slider
                        value={[distanceFilter || 5]}
                        onValueChange={(value) => setDistanceFilter(value[0])}
                        max={20}
                        min={0.5}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>0.5 km</span>
                        <span className="font-medium">{distanceFilter ? `${distanceFilter} km` : "5 km"}</span>
                        <span>20 km</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Quick Distance Filters</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={distanceFilter === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDistanceFilter(1)}
                      >
                        Within 1 km
                      </Button>
                      <Button
                        variant={distanceFilter === 2 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDistanceFilter(2)}
                      >
                        Within 2 km
                      </Button>
                      <Button
                        variant={distanceFilter === 5 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDistanceFilter(5)}
                      >
                        Within 5 km
                      </Button>
                      <Button
                        variant={distanceFilter === 10 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDistanceFilter(10)}
                      >
                        Within 10 km
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDistanceFilter(null)
                        setShowFilters(false)
                      }}
                      className="flex-1"
                    >
                      Clear Filters
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Active Filters Display */}
      {distanceFilter && (
        <section className="bg-blue-50 border-b py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>Active filters:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Within {distanceFilter} km
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDistanceFilter(null)}
                className="text-blue-700 hover:text-blue-900"
              >
                Clear all
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Restaurants Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Restaurants near you</h2>
          </div>

          {loading && restaurants.length === 0 ? (
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

          {hasMore && !loading && filteredRestaurants.length > 0 && (
            <div className="text-center mt-8">
              <Button
                onClick={handleLoadMore}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More Restaurants"}
              </Button>
            </div>
          )}

          {!hasMore && filteredRestaurants.length > 0 && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-lg">No more restaurants to load.</p>
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
  {
    id: "5",
    name: "Curry House",
    cuisine: "Indian",
    rating: 4.6,
    deliveryTime: "20-30 min",
    deliveryFee: 35,
    image: "/placeholder.svg?height=200&width=300",
    distance: 1.8,
    isOpen: true,
    priceRange: "₹₹",
    address: "Jubilee Hills, Hyderabad, Telangana 500033",
  },
  {
    id: "6",
    name: "Noodle Nook",
    cuisine: "Chinese",
    rating: 4.1,
    deliveryTime: "25-40 min",
    deliveryFee: 45,
    image: "/placeholder.svg?height=200&width=300",
    distance: 2.5,
    isOpen: true,
    priceRange: "₹",
    address: "Chandni Chowk, Delhi 110006",
  },
]
