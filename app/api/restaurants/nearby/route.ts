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

        const restaurantData = {
          id: place.place_id || `place_${Math.random().toString(36).substr(2, 9)}`,
          name: place.name,
          cuisine: getCuisineFromTypes(place.types) || "Multi-cuisine",
          rating: place.rating || 4.0,
          deliveryTime: deliveryTime,
          deliveryFee: Math.floor(Math.random() * 50) + 25,
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
          // Generate contextual menu
          menu: generateContextualMenu(place.types, place.name),
        }

        console.log(`📍 Processed restaurant: ${restaurantData.name} (ID: ${restaurantData.id})`)
        return restaurantData
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

      // Cache the restaurants for slug lookup
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/restaurants/slug/cache`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurants: uniqueRestaurants }),
        })
      } catch (cacheError) {
        console.log("Failed to cache restaurants:", cacheError)
      }

      return NextResponse.json({ restaurants: uniqueRestaurants })
    } catch (dbError) {
      console.log("Database query failed, using Google Places data only:", dbError)

      // Still try to cache the Google Places data
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/restaurants/slug/cache`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurants }),
        })
      } catch (cacheError) {
        console.log("Failed to cache restaurants:", cacheError)
      }

      return NextResponse.json({ restaurants: restaurants.sort((a, b) => (a.distance || 0) - (b.distance || 0)) })
    }
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error)
    return getFallbackRestaurants()
  }
}

function generateContextualMenu(types: string[], restaurantName: string) {
  const name = restaurantName.toLowerCase()
  let menuType = "general"

  if (
    types.includes("indian_restaurant") ||
    name.includes("biryani") ||
    name.includes("tandoor") ||
    name.includes("curry") ||
    name.includes("indian") ||
    name.includes("punjabi") ||
    name.includes("south indian")
  ) {
    menuType = "indian"
  } else if (
    types.includes("chinese_restaurant") ||
    name.includes("chinese") ||
    name.includes("noodle") ||
    name.includes("wok") ||
    name.includes("dragon") ||
    name.includes("golden")
  ) {
    menuType = "chinese"
  } else if (
    types.includes("italian_restaurant") ||
    types.includes("pizza_restaurant") ||
    name.includes("pizza") ||
    name.includes("italian") ||
    name.includes("pasta") ||
    name.includes("romano")
  ) {
    menuType = "italian"
  } else if (
    types.includes("fast_food_restaurant") ||
    types.includes("meal_takeaway") ||
    name.includes("burger") ||
    name.includes("kfc") ||
    name.includes("mcdonald") ||
    name.includes("subway") ||
    name.includes("quick")
  ) {
    menuType = "fastfood"
  } else if (
    types.includes("cafe") ||
    types.includes("bakery") ||
    name.includes("cafe") ||
    name.includes("coffee") ||
    name.includes("starbucks") ||
    name.includes("barista")
  ) {
    menuType = "cafe"
  } else if (
    types.includes("japanese_restaurant") ||
    types.includes("sushi_restaurant") ||
    name.includes("sushi") ||
    name.includes("japanese") ||
    name.includes("ramen")
  ) {
    menuType = "japanese"
  } else if (types.includes("thai_restaurant") || name.includes("thai") || name.includes("bangkok")) {
    menuType = "thai"
  }

  return getMenuByType(menuType, restaurantName)
}

function getMenuByType(menuType: string, restaurantName: string) {
  const baseId = restaurantName.replace(/\s+/g, "_").toLowerCase()

  const menuTemplates: { [key: string]: any[] } = {
    indian: [
      {
        name: "Butter Chicken",
        description: "Tender chicken in rich tomato and butter gravy",
        price: 349,
        category: "main course",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Paneer Butter Masala",
        description: "Cottage cheese in creamy tomato gravy",
        price: 299,
        category: "main course",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Biryani",
        description: "Aromatic basmati rice with tender chicken pieces",
        price: 329,
        category: "biryani",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Garlic Naan",
        description: "Soft bread with garlic and butter",
        price: 69,
        category: "bread",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    chinese: [
      {
        name: "Kung Pao Chicken",
        description: "Spicy stir-fried chicken with peanuts and vegetables",
        price: 299,
        category: "main course",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Vegetable Fried Rice",
        description: "Stir-fried rice with mixed vegetables",
        price: 199,
        category: "rice",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Spring Rolls",
        description: "Crispy rolls filled with vegetables",
        price: 99,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Hot and Sour Soup",
        description: "Spicy soup with vegetables",
        price: 149,
        category: "soup",
        isVegetarian: true,
        isSpicy: true,
      },
    ],
    italian: [
      {
        name: "Margherita Pizza",
        description: "Fresh tomatoes, mozzarella, and basil",
        price: 299,
        category: "pizza",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Spaghetti Carbonara",
        description: "Pasta with eggs, pancetta, and Parmesan cheese",
        price: 349,
        category: "pasta",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Caesar Salad",
        description: "Crisp romaine lettuce with parmesan cheese and Caesar dressing",
        price: 199,
        category: "salad",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Tiramisu",
        description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cheese",
        price: 249,
        category: "dessert",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    fastfood: [
      {
        name: "Cheeseburger",
        description: "Beef patty with cheese and lettuce",
        price: 149,
        category: "burgers",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "French Fries",
        description: "Crispy fried potatoes",
        price: 99,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Nuggets",
        description: "Breaded and fried chicken pieces",
        price: 199,
        category: "nuggets",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Soft Drink",
        description: "Refreshing soft drink",
        price: 49,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    cafe: [
      {
        name: "Espresso",
        description: "Strong coffee",
        price: 99,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Cappuccino",
        description: "Espresso with steamed milk and foam",
        price: 149,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Croissant",
        description: "Buttery flaky pastry",
        price: 199,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Bagel",
        description: "Jewish rye bread with cream cheese",
        price: 149,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    japanese: [
      {
        name: "Sushi Roll",
        description: "Rice roll with fresh fish and vegetables",
        price: 299,
        category: "sushi",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Tempura",
        description: "Lightly battered and fried vegetables",
        price: 199,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Udon Noodles",
        description: "Thick wheat noodles in a savory broth",
        price: 249,
        category: "noodles",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Matcha Latte",
        description: "Green tea latte",
        price: 149,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    thai: [
      {
        name: "Green Curry",
        description: "Spicy curry with green peppers and coconut milk",
        price: 299,
        category: "curry",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Pad Thai",
        description: "Stir-fried rice noodles with shrimp and vegetables",
        price: 199,
        category: "noodles",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Tom Yum Soup",
        description: "Spicy soup with shrimp and lemongrass",
        price: 149,
        category: "soup",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Mango Sticky Rice",
        description: "Sweet sticky rice with mango",
        price: 249,
        category: "dessert",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    general: [
      {
        name: "Chef's Special",
        description: "Today's recommended dish",
        price: 299,
        category: "specials",
        isVegetarian: false,
        isSpicy: false,
      },
    ],
  }

  const selectedMenu = menuTemplates[menuType] ||
    menuTemplates.general || [
      {
        name: "Chef's Special",
        description: "Today's recommended dish",
        price: 299,
        category: "specials",
        isVegetarian: false,
        isSpicy: false,
      },
    ]

  return selectedMenu.map((item, index) => ({
    id: `${baseId}_${index + 1}`,
    ...item,
    image: "/placeholder.svg?height=200&width=300",
    isAvailable: true,
  }))
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
      menu: [
        {
          id: "pizza_palace_1",
          name: "Margherita Pizza",
          description: "Fresh tomatoes, mozzarella, and basil",
          price: 299,
          category: "pizza",
          image: "/placeholder.svg?height=200&width=300",
          isVegetarian: true,
          isSpicy: false,
          isAvailable: true,
        },
      ],
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
      menu: [
        {
          id: "burger_junction_1",
          name: "Classic Burger",
          description: "Beef patty with lettuce and tomato",
          price: 199,
          category: "burgers",
          image: "/placeholder.svg?height=200&width=300",
          isVegetarian: false,
          isSpicy: false,
          isAvailable: true,
        },
      ],
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
