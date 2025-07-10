import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fooddelivery"

async function seedDatabase() {
  if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI environment variable not set. Using sample data fallback.")
    return
  }

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("fooddelivery")

    // Create indexes
    console.log("Creating indexes...")
    await db.collection("restaurants").createIndex({ coordinates: "2dsphere" })
    await db.collection("restaurants").createIndex({ cuisine: 1 })
    await db.collection("restaurants").createIndex({ rating: -1 })
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("orders").createIndex({ userId: 1 })
    await db.collection("orders").createIndex({ createdAt: -1 })
    await db.collection("menu_items").createIndex({ restaurantId: 1 })

    // Clear existing data
    console.log("Clearing existing data...")
    await db.collection("restaurants").deleteMany({})
    await db.collection("menu_items").deleteMany({})

    // Insert sample restaurants
    console.log("Inserting restaurants...")
    const restaurants = [
      {
        name: "Pizza Palace",
        cuisine: "Italian",
        address: "MG Road, Bangalore, Karnataka 560001",
        coordinates: { lat: 12.9716, lng: 77.5946 },
        phone: "+91 80 1234 5678",
        rating: 4.5,
        deliveryFee: 49,
        deliveryTime: "25-35 min",
        isOpen: true,
        imageUrl: "/placeholder.svg?height=200&width=300",
        priceRange: "₹₹",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Burger Junction",
        cuisine: "American",
        address: "Connaught Place, New Delhi, Delhi 110001",
        coordinates: { lat: 28.6139, lng: 77.209 },
        phone: "+91 11 2345 6789",
        rating: 4.2,
        deliveryFee: 29,
        deliveryTime: "20-30 min",
        isOpen: true,
        imageUrl: "/placeholder.svg?height=200&width=300",
        priceRange: "₹",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Biryani House",
        cuisine: "Indian",
        address: "Hyderabad, Telangana 500001",
        coordinates: { lat: 17.385, lng: 78.4867 },
        phone: "+91 40 5678 9012",
        rating: 4.6,
        deliveryFee: 39,
        deliveryTime: "25-40 min",
        isOpen: true,
        imageUrl: "/placeholder.svg?height=200&width=300",
        priceRange: "₹₹",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "South Indian Delights",
        cuisine: "South Indian",
        address: "T. Nagar, Chennai, Tamil Nadu 600017",
        coordinates: { lat: 13.0827, lng: 80.2707 },
        phone: "+91 44 6789 0123",
        rating: 4.4,
        deliveryFee: 35,
        deliveryTime: "20-35 min",
        isOpen: true,
        imageUrl: "/placeholder.svg?height=200&width=300",
        priceRange: "₹",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Sushi Zen",
        cuisine: "Japanese",
        address: "Bandra West, Mumbai, Maharashtra 400050",
        coordinates: { lat: 19.0596, lng: 72.8295 },
        phone: "+91 22 3456 7890",
        rating: 4.7,
        deliveryFee: 79,
        deliveryTime: "30-45 min",
        isOpen: true,
        imageUrl: "/placeholder.svg?height=200&width=300",
        priceRange: "₹₹₹",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tandoor Express",
        cuisine: "North Indian",
        address: "Sector 18, Noida, Uttar Pradesh 201301",
        coordinates: { lat: 28.5706, lng: 77.3272 },
        phone: "+91 120 7890 1234",
        rating: 4.3,
        deliveryFee: 45,
        deliveryTime: "30-40 min",
        isOpen: true,
        imageUrl: "/placeholder.svg?height=200&width=300",
        priceRange: "₹₹",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const restaurantResult = await db.collection("restaurants").insertMany(restaurants)
    console.log(`✅ Inserted ${restaurantResult.insertedCount} restaurants`)

    // Get restaurant IDs for menu items
    const restaurantIds = Object.values(restaurantResult.insertedIds)

    // Insert sample menu items
    console.log("Inserting menu items...")
    const menuItems = [
      // Pizza Palace menu (restaurantIds[0])
      {
        restaurantId: restaurantIds[0],
        name: "Margherita Pizza",
        description: "Fresh tomatoes, mozzarella, basil, and olive oil",
        price: 299,
        category: "pizza",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[0],
        name: "Pepperoni Pizza",
        description: "Classic pepperoni with mozzarella cheese",
        price: 399,
        category: "pizza",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[0],
        name: "Caesar Salad",
        description: "Romaine lettuce, parmesan, croutons, caesar dressing",
        price: 199,
        category: "salads",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[0],
        name: "Garlic Bread",
        description: "Crispy bread with garlic butter and herbs",
        price: 149,
        category: "appetizers",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Burger Junction menu (restaurantIds[1])
      {
        restaurantId: restaurantIds[1],
        name: "Classic Burger",
        description: "Beef patty with lettuce, tomato, onion, and special sauce",
        price: 249,
        category: "burgers",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[1],
        name: "Veggie Burger",
        description: "Plant-based patty with fresh vegetables",
        price: 199,
        category: "burgers",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[1],
        name: "French Fries",
        description: "Crispy golden fries with sea salt",
        price: 99,
        category: "sides",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[1],
        name: "Chocolate Shake",
        description: "Rich chocolate milkshake with whipped cream",
        price: 129,
        category: "drinks",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Biryani House menu (restaurantIds[2])
      {
        restaurantId: restaurantIds[2],
        name: "Chicken Biryani",
        description: "Aromatic basmati rice with tender chicken and spices",
        price: 299,
        category: "biryani",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[2],
        name: "Mutton Biryani",
        description: "Fragrant rice with succulent mutton pieces",
        price: 399,
        category: "biryani",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[2],
        name: "Veg Biryani",
        description: "Mixed vegetables with aromatic basmati rice",
        price: 249,
        category: "biryani",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[2],
        name: "Raita",
        description: "Cool yogurt with cucumber and mint",
        price: 79,
        category: "sides",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // South Indian Delights menu (restaurantIds[3])
      {
        restaurantId: restaurantIds[3],
        name: "Masala Dosa",
        description: "Crispy crepe with spiced potato filling",
        price: 89,
        category: "dosa",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[3],
        name: "Idli Sambar",
        description: "Steamed rice cakes with lentil curry",
        price: 69,
        category: "breakfast",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[3],
        name: "Uttapam",
        description: "Thick pancake with vegetables and chutneys",
        price: 99,
        category: "breakfast",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[3],
        name: "Filter Coffee",
        description: "Traditional South Indian coffee",
        price: 39,
        category: "drinks",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Sushi Zen menu (restaurantIds[4])
      {
        restaurantId: restaurantIds[4],
        name: "California Roll",
        description: "Crab, avocado, and cucumber with sesame seeds",
        price: 299,
        category: "rolls",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[4],
        name: "Spicy Tuna Roll",
        description: "Fresh tuna with spicy mayo and cucumber",
        price: 349,
        category: "rolls",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[4],
        name: "Vegetable Roll",
        description: "Cucumber, avocado, and carrot with sesame seeds",
        price: 249,
        category: "rolls",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[4],
        name: "Miso Soup",
        description: "Traditional soybean soup with tofu and seaweed",
        price: 149,
        category: "soups",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Tandoor Express menu (restaurantIds[5])
      {
        restaurantId: restaurantIds[5],
        name: "Butter Chicken",
        description: "Tender chicken in rich tomato and butter gravy",
        price: 349,
        category: "curry",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: false,
        isSpicy: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[5],
        name: "Paneer Tikka",
        description: "Grilled cottage cheese with spices and mint chutney",
        price: 279,
        category: "appetizers",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[5],
        name: "Naan",
        description: "Soft leavened bread baked in tandoor",
        price: 49,
        category: "bread",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        restaurantId: restaurantIds[5],
        name: "Dal Makhani",
        description: "Creamy black lentils cooked with butter and spices",
        price: 229,
        category: "curry",
        imageUrl: "/placeholder.svg?height=200&width=300",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const menuResult = await db.collection("menu_items").insertMany(menuItems)
    console.log(`✅ Inserted ${menuResult.insertedCount} menu items`)

    console.log("🎉 Database seeded successfully!")
    console.log(`📊 Summary:`)
    console.log(`   - ${restaurantResult.insertedCount} restaurants`)
    console.log(`   - ${menuResult.insertedCount} menu items`)
    console.log(`   - Geospatial indexes created`)
    console.log(`   - Ready for production!`)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  } finally {
    await client.close()
    console.log("🔌 MongoDB connection closed")
  }
}

// Execute the seeding function
seedDatabase().catch(console.error)
