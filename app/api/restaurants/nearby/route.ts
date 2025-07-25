import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { type Restaurant, transformRestaurant } from "@/models/Restaurant"

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 5000, pagetoken } = await request.json()

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.warn("Google Places API key not found, using fallback data")
      return getFallbackRestaurants()
    }

    // Build Google Places API URL
    let placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${process.env.GOOGLE_PLACES_API_KEY}`

    // Add pagetoken if provided for pagination
    if (pagetoken) {
      placesUrl += `&pagetoken=${pagetoken}`
    }

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
      data.results.map(async (place: any) => {
        const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)

        // Generate phone number if not available
        let phoneNumber = "+91 " + Math.floor(Math.random() * 9000000000 + 1000000000)
        const deliveryTime = `${20 + Math.floor(Math.random() * 25)}-${35 + Math.floor(Math.random() * 15)} min`

        // Try to get place details for phone number (optional, can be skipped for performance)
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

    // Also try to fetch from our MongoDB database and merge (only on first page)
    let dbRestaurants: any[] = []
    if (!pagetoken) {
      try {
        const { db } = await connectToDatabase()
        const dbRestaurantsRaw = await db
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
        dbRestaurants = dbRestaurantsRaw.map((restaurant) => {
          const distance = calculateDistance(lat, lng, restaurant.coordinates.lat, restaurant.coordinates.lng)
          return transformRestaurant(restaurant, distance)
        })
      } catch (dbError) {
        console.log("Database query failed:", dbError)
      }
    }

    // Merge Google Places and database restaurants (only on first page)
    const allRestaurants = [...restaurants, ...dbRestaurants]

    // Remove duplicates and sort by distance
    const uniqueRestaurants = allRestaurants
      .filter(
        (restaurant, index, self) =>
          index === self.findIndex((r) => r.name.toLowerCase() === restaurant.name.toLowerCase()),
      )
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))

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

    // Return restaurants with pagination info
    return NextResponse.json({
      restaurants: uniqueRestaurants,
      nextPageToken: data.next_page_token || null,
      hasMore: !!data.next_page_token,
    })
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
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Paneer Butter Masala",
        description: "Cottage cheese in creamy tomato gravy",
        price: 299,
        category: "main course",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Biryani",
        description: "Aromatic basmati rice with tender chicken pieces",
        price: 329,
        category: "biryani",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Veg Biryani",
        description: "Fragrant rice with mixed vegetables and spices",
        price: 279,
        category: "biryani",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Tandoori Chicken",
        description: "Clay oven roasted chicken with Indian spices",
        price: 399,
        category: "tandoor",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Paneer Tikka",
        description: "Grilled cottage cheese with mint chutney",
        price: 279,
        category: "tandoor",
        isVegetarian: true,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Garlic Naan",
        description: "Soft bread with garlic and butter",
        price: 69,
        category: "bread",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Dal Makhani",
        description: "Creamy black lentils with butter",
        price: 229,
        category: "dal",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Gulab Jamun",
        description: "Sweet milk dumplings in sugar syrup",
        price: 99,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Vegetable Fried Rice",
        description: "Stir-fried rice with mixed vegetables",
        price: 199,
        category: "rice",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Chow Mein",
        description: "Stir-fried noodles with chicken",
        price: 269,
        category: "noodles",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Veg Hakka Noodles",
        description: "Indo-Chinese style vegetable noodles",
        price: 219,
        category: "noodles",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Sweet & Sour Chicken",
        description: "Crispy chicken in tangy sauce",
        price: 319,
        category: "chicken",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chilli Paneer",
        description: "Spicy cottage cheese with bell peppers",
        price: 279,
        category: "paneer",
        isVegetarian: true,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Spring Rolls",
        description: "Crispy rolls filled with vegetables",
        price: 99,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Hot and Sour Soup",
        description: "Spicy soup with vegetables",
        price: 149,
        category: "soup",
        isVegetarian: true,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Pepperoni Pizza",
        description: "Classic pepperoni with mozzarella cheese",
        price: 399,
        category: "pizza",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken BBQ Pizza",
        description: "BBQ chicken with onions and bell peppers",
        price: 449,
        category: "pizza",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Spaghetti Carbonara",
        description: "Pasta with eggs, pancetta, and Parmesan cheese",
        price: 349,
        category: "pasta",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Pasta Arrabbiata",
        description: "Spicy tomato pasta with herbs",
        price: 299,
        category: "pasta",
        isVegetarian: true,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Alfredo",
        description: "Creamy white sauce pasta with chicken",
        price: 379,
        category: "pasta",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Caesar Salad",
        description: "Crisp romaine lettuce with parmesan cheese and Caesar dressing",
        price: 199,
        category: "salad",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Garlic Bread",
        description: "Crispy bread with garlic butter",
        price: 149,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1619985632461-f33748ef8d3d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Tiramisu",
        description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cheese",
        price: 249,
        category: "dessert",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Burger",
        description: "Grilled chicken with mayo and vegetables",
        price: 229,
        category: "burgers",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1606755962773-d324e2dabd3f?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Veggie Burger",
        description: "Plant-based patty with fresh vegetables",
        price: 179,
        category: "burgers",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1525059696034-4967a729002e?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "French Fries",
        description: "Crispy fried potatoes",
        price: 99,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Wings",
        description: "Spicy buffalo chicken wings",
        price: 249,
        category: "chicken",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Nuggets",
        description: "Breaded and fried chicken pieces",
        price: 199,
        category: "nuggets",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Onion Rings",
        description: "Beer-battered onion rings",
        price: 129,
        category: "sides",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Soft Drink",
        description: "Refreshing soft drink",
        price: 49,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chocolate Shake",
        description: "Rich chocolate milkshake",
        price: 149,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Cappuccino",
        description: "Espresso with steamed milk and foam",
        price: 149,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Latte",
        description: "Smooth espresso with steamed milk",
        price: 149,
        category: "coffee",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Americano",
        description: "Espresso with hot water",
        price: 99,
        category: "coffee",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Sandwich",
        description: "Grilled chicken with vegetables",
        price: 199,
        category: "sandwiches",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Club Sandwich",
        description: "Triple-layer sandwich with chicken and bacon",
        price: 249,
        category: "sandwiches",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Croissant",
        description: "Buttery flaky pastry",
        price: 199,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chocolate Croissant",
        description: "Buttery pastry with chocolate filling",
        price: 89,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Blueberry Muffin",
        description: "Fresh baked muffin with blueberries",
        price: 79,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Bagel",
        description: "Jewish rye bread with cream cheese",
        price: 149,
        category: "pastries",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Cheesecake",
        description: "Creamy New York style cheesecake",
        price: 159,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Spicy Tuna Roll",
        description: "Fresh tuna with spicy mayo",
        price: 349,
        category: "sushi",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Vegetable Roll",
        description: "Cucumber, avocado, and carrot",
        price: 249,
        category: "sushi",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Teriyaki",
        description: "Grilled chicken with teriyaki sauce",
        price: 379,
        category: "mains",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Salmon Sashimi",
        description: "Fresh salmon slices (6 pieces)",
        price: 399,
        category: "sashimi",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1615361200098-eb3bcc2c9149?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Miso Soup",
        description: "Traditional soybean soup",
        price: 149,
        category: "soups",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Sushi Roll",
        description: "Rice roll with fresh fish and vegetables",
        price: 299,
        category: "sushi",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Tempura",
        description: "Lightly battered and fried vegetables",
        price: 199,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Udon Noodles",
        description: "Thick wheat noodles in a savory broth",
        price: 249,
        category: "noodles",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Chicken Ramen",
        description: "Rich broth with noodles and chicken",
        price: 329,
        category: "ramen",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Matcha Latte",
        description: "Green tea latte",
        price: 149,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Green Tea Ice Cream",
        description: "Traditional Japanese dessert",
        price: 129,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Pad Thai",
        description: "Stir-fried rice noodles with shrimp and vegetables",
        price: 199,
        category: "noodles",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Tom Yum Soup",
        description: "Spicy soup with shrimp and lemongrass",
        price: 149,
        category: "soup",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Thai Fried Rice",
        description: "Jasmine rice with Thai herbs",
        price: 249,
        category: "rice",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Massaman Curry",
        description: "Mild curry with potatoes",
        price: 319,
        category: "curry",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Spring Rolls",
        description: "Fresh vegetables in rice paper",
        price: 149,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Mango Sticky Rice",
        description: "Sweet sticky rice with mango",
        price: 249,
        category: "dessert",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Grilled Chicken",
        description: "Tender grilled chicken with herbs",
        price: 349,
        category: "mains",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Vegetarian Platter",
        description: "Mixed vegetarian dishes",
        price: 279,
        category: "vegetarian",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Mixed Salad",
        description: "Fresh seasonal vegetables",
        price: 179,
        category: "salads",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Soup of the Day",
        description: "Chef's daily soup selection",
        price: 149,
        category: "soups",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Fresh Juice",
        description: "Seasonal fruit juice",
        price: 99,
        category: "drinks",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&h=200&fit=crop&crop=center",
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
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&crop=center",
      },
    ]

  return selectedMenu.map((item, index) => ({
    id: `${baseId}_${index + 1}`,
    ...item,
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

  return NextResponse.json({
    restaurants: sampleRestaurants,
    nextPageToken: null,
    hasMore: false,
  })
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

