import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { type Restaurant, transformRestaurant } from "@/models/Restaurant"

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 5000 } = await request.json()

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.warn("Google Places API key not found, using fallback data")
      return getFallbackRestaurants()
    }

    // Use Google Places API Nearby Search
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${process.env.GOOGLE_PLACES_API_KEY}`

    console.log("Fetching from Google Places API...")
    const response = await fetch(placesUrl)

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Google Places API status:", data.status)
      return getFallbackRestaurants()
    }

    // Transform Google Places data to our format
    const restaurants = await Promise.all(
      data.results.slice(0, 20).map(async (place: any) => {
        const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)

        // Get additional details if place_id exists
        let phoneNumber = "+91 " + Math.floor(Math.random() * 9000000000 + 1000000000)
        const deliveryTime = `${20 + Math.floor(Math.random() * 25)}-${35 + Math.floor(Math.random() * 15)} min`

        // Try to get place details for phone number
        if (place.place_id) {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number&key=${process.env.GOOGLE_PLACES_API_KEY}`
            const detailsResponse = await fetch(detailsUrl)
            const detailsData = await detailsResponse.json()

            if (detailsData.result?.formatted_phone_number) {
              phoneNumber = detailsData.result.formatted_phone_number
            }
          } catch (error) {
            console.log("Could not fetch place details:", error)
          }
        }

        return {
          id: place.place_id || `place_${Math.random().toString(36).substr(2, 9)}`,
          name: place.name,
          cuisine: getCuisineFromTypes(place.types) || "Multi-cuisine",
          rating: place.rating || 4.0,
          deliveryTime: deliveryTime,
          deliveryFee: Math.floor(Math.random() * 50) + 25, // ₹25-₹75
          image: place.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
            : "/placeholder.svg?height=200&width=300",
          distance: distance,
          isOpen: place.opening_hours?.open_now ?? true,
          priceRange: getPriceRange(place.price_level),
          address: place.vicinity || place.formatted_address || "Address not available",
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          phone: phoneNumber,
        }
      }),
    )

    // Also try to fetch from our MongoDB database and merge
    try {
      const { db } = await connectToDatabase()
      const dbRestaurants = await db
        .collection<Restaurant>("restaurants")
        .find({
          coordinates: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: radius,
            },
          },
          isOpen: true,
        })
        .limit(10)
        .toArray()

      // Transform and add database restaurants
      const dbRestaurantsTransformed = dbRestaurants.map((restaurant) => {
        const distance = calculateDistance(lat, lng, restaurant.coordinates.lat, restaurant.coordinates.lng)
        return transformRestaurant(restaurant, distance)
      })

      // Merge Google Places and database restaurants
      const allRestaurants = [...restaurants, ...dbRestaurantsTransformed]

      // Remove duplicates and sort by distance
      const uniqueRestaurants = allRestaurants
        .filter(
          (restaurant, index, self) =>
            index === self.findIndex((r) => r.name.toLowerCase() === restaurant.name.toLowerCase()),
        )
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20)

      return NextResponse.json({ restaurants: uniqueRestaurants })
    } catch (dbError) {
      console.log("Database query failed, using Google Places data only:", dbError)
      return NextResponse.json({ restaurants: restaurants.sort((a, b) => (a.distance || 0) - (b.distance || 0)) })
    }
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error)
    return getFallbackRestaurants()
  }
}

// Helper function to determine cuisine from Google Places types
function getCuisineFromTypes(types: string[]): string {
  const cuisineMap: { [key: string]: string } = {
    chinese_restaurant: "Chinese",
    indian_restaurant: "Indian",
    italian_restaurant: "Italian",
    japanese_restaurant: "Japanese",
    mexican_restaurant: "Mexican",
    thai_restaurant: "Thai",
    american_restaurant: "American",
    french_restaurant: "French",
    korean_restaurant: "Korean",
    mediterranean_restaurant: "Mediterranean",
    pizza_restaurant: "Pizza",
    seafood_restaurant: "Seafood",
    steakhouse: "Steakhouse",
    sushi_restaurant: "Japanese",
    vegetarian_restaurant: "Vegetarian",
    fast_food_restaurant: "Fast Food",
    cafe: "Cafe",
    bakery: "Bakery",
  }

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type]
    }
  }

  // Fallback based on common restaurant types
  if (types.includes("meal_takeaway") || types.includes("meal_delivery")) {
    return "Fast Food"
  }
  if (types.includes("food")) {
    return "Restaurant"
  }

  return "Multi-cuisine"
}

// Helper function to convert Google's price level to Indian price range
function getPriceRange(priceLevel?: number): string {
  switch (priceLevel) {
    case 0:
      return "₹"
    case 1:
      return "₹"
    case 2:
      return "₹₹"
    case 3:
      return "₹₹₹"
    case 4:
      return "₹₹₹₹"
    default:
      return "₹₹"
  }
}

// Fallback function for when Google Places API fails
function getFallbackRestaurants() {
  const sampleRestaurants = [
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
      coordinates: { lat: 12.9716, lng: 77.5946 },
      phone: "+91 80 1234 5678",
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
      coordinates: { lat: 28.6139, lng: 77.209 },
      phone: "+91 11 2345 6789",
    },
    {
      id: "3",
      name: "Biryani House",
      cuisine: "Indian",
      rating: 4.6,
      deliveryTime: "25-40 min",
      deliveryFee: 39,
      image: "/placeholder.svg?height=200&width=300",
      distance: 1.8,
      isOpen: true,
      priceRange: "₹₹",
      address: "Hyderabad, Telangana 500001",
      coordinates: { lat: 17.385, lng: 78.4867 },
      phone: "+91 40 5678 9012",
    },
    {
      id: "4",
      name: "South Indian Delights",
      cuisine: "South Indian",
      rating: 4.4,
      deliveryTime: "20-35 min",
      deliveryFee: 35,
      image: "/placeholder.svg?height=200&width=300",
      distance: 1.5,
      isOpen: true,
      priceRange: "₹",
      address: "T. Nagar, Chennai, Tamil Nadu 600017",
      coordinates: { lat: 13.0827, lng: 80.2707 },
      phone: "+91 44 6789 0123",
    },
  ]

  return NextResponse.json({ restaurants: sampleRestaurants })
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}
