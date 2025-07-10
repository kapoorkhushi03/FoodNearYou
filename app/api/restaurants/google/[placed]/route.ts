import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { placeId: string } }) {
  try {
    const { placeId } = params

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
    }

    // Get place details from Google Places API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,rating,reviews,price_level,types&key=${process.env.GOOGLE_PLACES_API_KEY}`

    const response = await fetch(detailsUrl)

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      return NextResponse.json({ error: `Google Places API error: ${data.status}` }, { status: 400 })
    }

    const place = data.result

    // Generate sample menu based on restaurant type
    const menu = generateSampleMenu(place.types, place.name)

    const restaurant = {
      id: placeId,
      name: place.name,
      cuisine: getCuisineFromTypes(place.types),
      rating: place.rating || 4.0,
      deliveryTime: `${20 + Math.floor(Math.random() * 25)}-${35 + Math.floor(Math.random() * 15)} min`,
      deliveryFee: Math.floor(Math.random() * 50) + 25,
      image: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        : "/placeholder.svg?height=300&width=800",
      address: place.formatted_address || "Address not available",
      phone: place.formatted_phone_number || "+91 " + Math.floor(Math.random() * 9000000000 + 1000000000),
      isOpen: place.opening_hours?.open_now ?? true,
      coordinates: { lat: 0, lng: 0 }, // Would need geocoding for exact coordinates
      priceRange: getPriceRange(place.price_level),
      website: place.website,
      menu: menu,
    }

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error("Error fetching restaurant details:", error)
    return NextResponse.json({ error: "Failed to fetch restaurant details" }, { status: 500 })
  }
}

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
  return "Multi-cuisine"
}

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

function generateSampleMenu(types: string[], restaurantName: string) {
  const menuTemplates: { [key: string]: any[] } = {
    indian_restaurant: [
      {
        name: "Butter Chicken",
        description: "Tender chicken in rich tomato and butter gravy",
        price: 349,
        category: "curry",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Paneer Tikka",
        description: "Grilled cottage cheese with spices",
        price: 279,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: true,
      },
      {
        name: "Biryani",
        description: "Aromatic basmati rice with spices",
        price: 299,
        category: "rice",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Naan",
        description: "Soft leavened bread",
        price: 49,
        category: "bread",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    chinese_restaurant: [
      {
        name: "Fried Rice",
        description: "Wok-fried rice with vegetables",
        price: 199,
        category: "rice",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chow Mein",
        description: "Stir-fried noodles with vegetables",
        price: 229,
        category: "noodles",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Sweet & Sour Chicken",
        description: "Crispy chicken in tangy sauce",
        price: 299,
        category: "chicken",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Spring Rolls",
        description: "Crispy vegetable rolls",
        price: 149,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    italian_restaurant: [
      {
        name: "Margherita Pizza",
        description: "Fresh tomatoes, mozzarella, basil",
        price: 299,
        category: "pizza",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Pasta Carbonara",
        description: "Creamy pasta with bacon",
        price: 349,
        category: "pasta",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Caesar Salad",
        description: "Romaine lettuce with parmesan",
        price: 199,
        category: "salads",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Garlic Bread",
        description: "Crispy bread with garlic butter",
        price: 149,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
    fast_food_restaurant: [
      {
        name: "Classic Burger",
        description: "Beef patty with lettuce and tomato",
        price: 199,
        category: "burgers",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "French Fries",
        description: "Crispy golden fries",
        price: 99,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Wings",
        description: "Spicy chicken wings",
        price: 249,
        category: "chicken",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Milkshake",
        description: "Creamy vanilla milkshake",
        price: 129,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
  }

  // Find matching template
  for (const type of types) {
    if (menuTemplates[type]) {
      return menuTemplates[type].map((item, index) => ({
        id: `${restaurantName.replace(/\s+/g, "_").toLowerCase()}_${index + 1}`,
        ...item,
        image: "/placeholder.svg?height=200&width=300",
        isAvailable: true,
      }))
    }
  }

  // Default menu
  return [
    {
      id: "default_1",
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
      id: "default_2",
      name: "Vegetarian Option",
      description: "Fresh vegetarian dish",
      price: 249,
      category: "vegetarian",
      image: "/placeholder.svg?height=200&width=300",
      isVegetarian: true,
      isSpicy: false,
      isAvailable: true,
    },
    {
      id: "default_3",
      name: "Popular Item",
      description: "Most ordered dish",
      price: 199,
      category: "popular",
      image: "/placeholder.svg?height=200&width=300",
      isVegetarian: false,
      isSpicy: false,
      isAvailable: true,
    },
  ]
}
