import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { placeId: string } }) {
  try {
    const { placeId } = params

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
    }

    // Get place details from Google Places API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,rating,reviews,price_level,types,geometry&key=${process.env.GOOGLE_PLACES_API_KEY}`

    const response = await fetch(detailsUrl)

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      return NextResponse.json({ error: `Google Places API error: ${data.status}` }, { status: 400 })
    }

    const place = data.result

    // Generate contextual menu based on restaurant type and name
    const menu = generateContextualMenu(place.types, place.name)
    const cuisine = getCuisineFromTypes(place.types)

    const restaurant = {
      id: placeId,
      name: place.name,
      cuisine: cuisine,
      rating: place.rating || 4.0,
      deliveryTime: calculateDeliveryTime(cuisine),
      deliveryFee: calculateDeliveryFee(place.price_level),
      image: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        : "/placeholder.svg?height=300&width=800",
      address: place.formatted_address || "Address not available",
      phone: place.formatted_phone_number || generateIndianPhoneNumber(),
      isOpen: place.opening_hours?.open_now ?? true,
      coordinates: place.geometry?.location || { lat: 0, lng: 0 },
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
    bar: "Bar & Grill",
    night_club: "Bar & Grill",
    meal_takeaway: "Takeaway",
    meal_delivery: "Quick Bites",
  }

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type]
    }
  }

  // Smart detection based on restaurant name
  const name = types.join(" ").toLowerCase()
  if (name.includes("pizza")) return "Pizza"
  if (name.includes("burger")) return "American"
  if (name.includes("coffee") || name.includes("cafe")) return "Cafe"
  if (name.includes("biryani") || name.includes("indian")) return "Indian"
  if (name.includes("chinese")) return "Chinese"

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

function calculateDeliveryTime(cuisine: string): string {
  const timeMap: { [key: string]: string } = {
    "Fast Food": "15-25 min",
    Pizza: "20-30 min",
    Chinese: "25-35 min",
    Indian: "30-45 min",
    Italian: "25-40 min",
    Japanese: "35-50 min",
    Thai: "30-45 min",
    Cafe: "15-25 min",
    Bakery: "10-20 min",
  }

  return timeMap[cuisine] || "25-40 min"
}

function calculateDeliveryFee(priceLevel?: number): number {
  switch (priceLevel) {
    case 0:
    case 1:
      return Math.floor(Math.random() * 20) + 25 // ₹25-₹45
    case 2:
      return Math.floor(Math.random() * 25) + 35 // ₹35-₹60
    case 3:
      return Math.floor(Math.random() * 30) + 50 // ₹50-₹80
    case 4:
      return Math.floor(Math.random() * 40) + 70 // ₹70-₹110
    default:
      return Math.floor(Math.random() * 25) + 35 // ₹35-₹60
  }
}

function generateIndianPhoneNumber(): string {
  const areaCodes = ["80", "11", "22", "44", "40", "33", "79", "20"]
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)]
  const number = Math.floor(Math.random() * 90000000) + 10000000
  return `+91 ${areaCode} ${number.toString().slice(0, 4)} ${number.toString().slice(4)}`
}

function generateContextualMenu(types: string[], restaurantName: string) {
  const name = restaurantName.toLowerCase()
  const typeString = types.join(" ").toLowerCase()

  // Determine menu type based on restaurant name and types
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
        name: "Veg Biryani",
        description: "Fragrant rice with mixed vegetables and spices",
        price: 279,
        category: "biryani",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Tandoori Chicken",
        description: "Clay oven roasted chicken with Indian spices",
        price: 399,
        category: "tandoor",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Paneer Tikka",
        description: "Grilled cottage cheese with mint chutney",
        price: 279,
        category: "tandoor",
        isVegetarian: true,
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
      {
        name: "Dal Makhani",
        description: "Creamy black lentils with butter",
        price: 229,
        category: "dal",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Gulab Jamun",
        description: "Sweet milk dumplings in sugar syrup",
        price: 99,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
      },
    ],

    chinese: [
      {
        name: "Chicken Fried Rice",
        description: "Wok-fried rice with chicken and vegetables",
        price: 249,
        category: "rice",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Veg Fried Rice",
        description: "Stir-fried rice with mixed vegetables",
        price: 199,
        category: "rice",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Chow Mein",
        description: "Stir-fried noodles with chicken",
        price: 269,
        category: "noodles",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Veg Hakka Noodles",
        description: "Indo-Chinese style vegetable noodles",
        price: 219,
        category: "noodles",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Sweet & Sour Chicken",
        description: "Crispy chicken in tangy sauce",
        price: 319,
        category: "chicken",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Chilli Paneer",
        description: "Spicy cottage cheese with bell peppers",
        price: 279,
        category: "paneer",
        isVegetarian: true,
        isSpicy: true,
      },
      {
        name: "Chicken Manchurian",
        description: "Fried chicken balls in spicy sauce",
        price: 299,
        category: "chicken",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Spring Rolls",
        description: "Crispy vegetable rolls with sweet sauce",
        price: 149,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
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
        name: "Pepperoni Pizza",
        description: "Classic pepperoni with mozzarella cheese",
        price: 399,
        category: "pizza",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Chicken BBQ Pizza",
        description: "BBQ chicken with onions and bell peppers",
        price: 449,
        category: "pizza",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Pasta Carbonara",
        description: "Creamy pasta with bacon and parmesan",
        price: 349,
        category: "pasta",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Pasta Arrabbiata",
        description: "Spicy tomato pasta with herbs",
        price: 299,
        category: "pasta",
        isVegetarian: true,
        isSpicy: true,
      },
      {
        name: "Chicken Alfredo",
        description: "Creamy white sauce pasta with chicken",
        price: 379,
        category: "pasta",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Caesar Salad",
        description: "Romaine lettuce with parmesan and croutons",
        price: 199,
        category: "salads",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Garlic Bread",
        description: "Crispy bread with garlic butter",
        price: 149,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Tiramisu",
        description: "Classic Italian coffee dessert",
        price: 179,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
      },
    ],

    fastfood: [
      {
        name: "Classic Burger",
        description: "Beef patty with lettuce, tomato, and sauce",
        price: 199,
        category: "burgers",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Chicken Burger",
        description: "Grilled chicken with mayo and vegetables",
        price: 229,
        category: "burgers",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Veggie Burger",
        description: "Plant-based patty with fresh vegetables",
        price: 179,
        category: "burgers",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "French Fries",
        description: "Crispy golden fries with salt",
        price: 99,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Wings",
        description: "Spicy buffalo chicken wings",
        price: 249,
        category: "chicken",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Chicken Nuggets",
        description: "Crispy chicken pieces with dip",
        price: 199,
        category: "chicken",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Onion Rings",
        description: "Beer-battered onion rings",
        price: 129,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chocolate Shake",
        description: "Rich chocolate milkshake",
        price: 149,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
    ],

    cafe: [
      {
        name: "Cappuccino",
        description: "Espresso with steamed milk foam",
        price: 129,
        category: "coffee",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Latte",
        description: "Smooth espresso with steamed milk",
        price: 149,
        category: "coffee",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Americano",
        description: "Espresso with hot water",
        price: 99,
        category: "coffee",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Sandwich",
        description: "Grilled chicken with vegetables",
        price: 199,
        category: "sandwiches",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Club Sandwich",
        description: "Triple-layer sandwich with chicken and bacon",
        price: 249,
        category: "sandwiches",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Chocolate Croissant",
        description: "Buttery pastry with chocolate filling",
        price: 89,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Blueberry Muffin",
        description: "Fresh baked muffin with blueberries",
        price: 79,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Cheesecake",
        description: "Creamy New York style cheesecake",
        price: 159,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
      },
    ],

    japanese: [
      {
        name: "California Roll",
        description: "Crab, avocado, and cucumber roll",
        price: 299,
        category: "sushi",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Spicy Tuna Roll",
        description: "Fresh tuna with spicy mayo",
        price: 349,
        category: "sushi",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Vegetable Roll",
        description: "Cucumber, avocado, and carrot",
        price: 249,
        category: "sushi",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Teriyaki",
        description: "Grilled chicken with teriyaki sauce",
        price: 379,
        category: "mains",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Salmon Sashimi",
        description: "Fresh salmon slices (6 pieces)",
        price: 399,
        category: "sashimi",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Miso Soup",
        description: "Traditional soybean soup",
        price: 149,
        category: "soups",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Chicken Ramen",
        description: "Rich broth with noodles and chicken",
        price: 329,
        category: "ramen",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Green Tea Ice Cream",
        description: "Traditional Japanese dessert",
        price: 129,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
      },
    ],

    thai: [
      {
        name: "Pad Thai",
        description: "Stir-fried noodles with tamarind sauce",
        price: 279,
        category: "noodles",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Green Curry",
        description: "Spicy coconut curry with vegetables",
        price: 299,
        category: "curry",
        isVegetarian: true,
        isSpicy: true,
      },
      {
        name: "Tom Yum Soup",
        description: "Spicy and sour Thai soup",
        price: 199,
        category: "soups",
        isVegetarian: false,
        isSpicy: true,
      },
      {
        name: "Thai Fried Rice",
        description: "Jasmine rice with Thai herbs",
        price: 249,
        category: "rice",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Massaman Curry",
        description: "Mild curry with potatoes",
        price: 319,
        category: "curry",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Spring Rolls",
        description: "Fresh vegetables in rice paper",
        price: 149,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Mango Sticky Rice",
        description: "Sweet coconut rice with mango",
        price: 159,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
      },
    ],

    general: [
      {
        name: "Chef's Special",
        description: "Today's recommended dish by our chef",
        price: 299,
        category: "specials",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Grilled Chicken",
        description: "Tender grilled chicken with herbs",
        price: 349,
        category: "mains",
        isVegetarian: false,
        isSpicy: false,
      },
      {
        name: "Vegetarian Platter",
        description: "Mixed vegetarian dishes",
        price: 279,
        category: "vegetarian",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Mixed Salad",
        description: "Fresh seasonal vegetables",
        price: 179,
        category: "salads",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Soup of the Day",
        description: "Chef's daily soup selection",
        price: 149,
        category: "soups",
        isVegetarian: true,
        isSpicy: false,
      },
      {
        name: "Fresh Juice",
        description: "Seasonal fruit juice",
        price: 99,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
      },
    ],
  }

  const selectedMenu = menuTemplates[menuType] || menuTemplates.general

  return selectedMenu.map((item, index) => ({
    id: `${baseId}_${index + 1}`,
    ...item,
    image: "/placeholder.svg?height=200&width=300",
    isAvailable: true,
  }))
}
