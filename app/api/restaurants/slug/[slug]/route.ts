import { type NextRequest, NextResponse } from "next/server"

// In-memory cache to store restaurant data temporarily
const restaurantCache = new Map()

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    console.log("🔍 Looking up restaurant by slug:", slug)

    // Extract the hash from the slug (last 6 characters after the last hyphen)
    const parts = slug.split("-")
    const hash = parts[parts.length - 1]
    const nameSlug = parts.slice(0, -1).join("-")

    console.log("📝 Extracted hash:", hash, "Name slug:", nameSlug)

    // Check if we have this restaurant in our cache
    const cachedRestaurant = restaurantCache.get(hash)
    if (cachedRestaurant) {
      console.log("✅ Found restaurant in cache:", cachedRestaurant.name)
      return NextResponse.json({ restaurant: cachedRestaurant })
    }

    // If not in cache, we need to reconstruct the restaurant data
    // This would happen if someone directly visits a URL
    console.log("⚠️ Restaurant not in cache, creating from slug")

    // Create a restaurant based on the slug
    const restaurant = createRestaurantFromSlug(slug, nameSlug, hash)

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error("❌ Error fetching restaurant by slug:", error)
    return NextResponse.json({ error: "Failed to fetch restaurant" }, { status: 500 })
  }
}

// Store restaurant data in cache (called from nearby API)
export async function POST(request: NextRequest) {
  try {
    const { restaurants } = await request.json()

    // Cache all restaurants with their hash as key
    restaurants.forEach((restaurant: any) => {
      const hash = restaurant.id.slice(-6)
      restaurantCache.set(hash, restaurant)
    })

    console.log(`💾 Cached ${restaurants.length} restaurants`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error caching restaurants:", error)
    return NextResponse.json({ error: "Failed to cache restaurants" }, { status: 500 })
  }
}

function createRestaurantFromSlug(slug: string, nameSlug: string, hash: string) {
  // Convert slug back to restaurant name
  const name = nameSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  // Determine cuisine and menu type from name
  const lowerName = name.toLowerCase()
  let cuisine = "Multi-cuisine"
  let menuType = "general"

  if (lowerName.includes("pizza")) {
    cuisine = "Italian"
    menuType = "italian"
  } else if (lowerName.includes("burger") || lowerName.includes("junction")) {
    cuisine = "American"
    menuType = "fastfood"
  } else if (lowerName.includes("biryani") || lowerName.includes("tandoor") || lowerName.includes("indian")) {
    cuisine = "Indian"
    menuType = "indian"
  } else if (lowerName.includes("chinese") || lowerName.includes("dragon") || lowerName.includes("golden")) {
    cuisine = "Chinese"
    menuType = "chinese"
  } else if (lowerName.includes("sushi") || lowerName.includes("zen") || lowerName.includes("japanese")) {
    cuisine = "Japanese"
    menuType = "japanese"
  } else if (lowerName.includes("cafe") || lowerName.includes("coffee") || lowerName.includes("starbucks")) {
    cuisine = "Cafe"
    menuType = "cafe"
  } else if (lowerName.includes("thai") || lowerName.includes("bangkok")) {
    cuisine = "Thai"
    menuType = "thai"
  }

  // Generate menu based on detected type
  const menu = generateMenuByType(menuType, name)

  return {
    id: `reconstructed_${hash}`,
    name: name,
    cuisine: cuisine,
    rating: 4.0 + Math.random() * 1, // Random rating between 4.0-5.0
    deliveryTime: `${20 + Math.floor(Math.random() * 25)}-${35 + Math.floor(Math.random() * 15)} min`,
    deliveryFee: Math.floor(Math.random() * 50) + 25,
    image: "/placeholder.svg?height=300&width=800",
    address: "Restaurant Address, City, State",
    phone: "+91 " + Math.floor(Math.random() * 9000000000 + 1000000000),
    isOpen: true,
    coordinates: { lat: 0, lng: 0 },
    priceRange: "₹₹",
    menu: menu,
  }
}

function generateMenuByType(menuType: string, restaurantName: string) {
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
        name: "Chicken Fried Rice",
        description: "Wok-fried rice with chicken and vegetables",
        price: 249,
        category: "rice",
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
        name: "Pasta Carbonara",
        description: "Creamy pasta with bacon and parmesan",
        price: 349,
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
        name: "French Fries",
        description: "Crispy golden fries with salt",
        price: 99,
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
        name: "Miso Soup",
        description: "Traditional soybean soup",
        price: 149,
        category: "soups",
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
        name: "Chicken Sandwich",
        description: "Grilled chicken with vegetables",
        price: 199,
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
        name: "Cheesecake",
        description: "Creamy New York style cheesecake",
        price: 159,
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
