require('dotenv').config({ path: '.env' });
const { MongoClient } = require("mongodb")

async function seedDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    console.log("⚠️  MONGODB_URI not found in environment variables")
    console.log("📝 Please set your MongoDB connection string in the environment")
    console.log("🔗 Example: mongodb+srv://username:password@cluster.mongodb.net/fooddelivery")
    return
  }

  console.log("🚀 Starting database seeding...")

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("fooddelivery")

    // Create collections and indexes
    console.log("📋 Creating indexes...")

    // Restaurants collection with geospatial index
    await db.collection("restaurants").createIndex({ coordinates: "2dsphere" })
    await db.collection("restaurants").createIndex({ cuisine: 1 })
    await db.collection("restaurants").createIndex({ rating: -1 })

    // Users collection
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ username: 1 }, { unique: true })

    // Orders collection
    await db.collection("orders").createIndex({ userId: 1 })
    await db.collection("orders").createIndex({ createdAt: -1 })

    // Menu items collection
    await db.collection("menu_items").createIndex({ restaurantId: 1 })

    console.log("🗑️  Clearing existing data...")
    await db.collection("restaurants").deleteMany({})
    await db.collection("menu_items").deleteMany({})

    // Sample restaurants data
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
    ]

    console.log("🏪 Inserting restaurants...")
    const restaurantResult = await db.collection("restaurants").insertMany(restaurants)
    console.log(`✅ Inserted ${restaurantResult.insertedCount} restaurants`)

    // Get restaurant IDs for menu items
    const restaurantIds = Object.values(restaurantResult.insertedIds)

    // Sample menu items
    const menuItems = [
      // Pizza Palace
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
      // Biryani House
      {
        restaurantId: restaurantIds[1],
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
        restaurantId: restaurantIds[1],
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
      // South Indian Delights
      {
        restaurantId: restaurantIds[2],
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
        restaurantId: restaurantIds[2],
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
    ]

    console.log("🍽️  Inserting menu items...")
    const menuResult = await db.collection("menu_items").insertMany(menuItems)
    console.log(`✅ Inserted ${menuResult.insertedCount} menu items`)

    console.log("\n🎉 Database seeding completed successfully!")
    console.log("📊 Summary:")
    console.log(`   • ${restaurantResult.insertedCount} restaurants added`)
    console.log(`   • ${menuResult.insertedCount} menu items added`)
    console.log("   • Geospatial indexes created for location search")
    console.log("   • Ready for production! 🚀")
  } catch (error) {
    console.error("❌ Error seeding database:", error.message)
    if (error.code === 11000) {
      console.log("💡 This might be a duplicate key error - data may already exist")
    }
  } finally {
    await client.close()
    console.log("🔌 Database connection closed")
  }
}

// Run the seeding function
seedDatabase()
