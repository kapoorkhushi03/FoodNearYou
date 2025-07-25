import { NextResponse } from "next/server"

const restaurants = [
  {
    id: "italian_delight",
    name: "Italian Delight",
    cuisine: "Italian",
    rating: 4.5,
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zip: "10001",
    menuTypes: ["pizza", "pasta", "salads", "desserts"],
  },
  {
    id: "spicy_indian",
    name: "Spicy Indian",
    cuisine: "Indian",
    rating: 4.2,
    address: "456 Elm St",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    menuTypes: ["indian", "biryani", "tandoor", "bread", "dal", "desserts"],
  },
  {
    id: "china_wok",
    name: "China Wok",
    cuisine: "Chinese",
    rating: 4.0,
    address: "789 Oak St",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    menuTypes: ["chinese", "rice", "noodles", "chicken", "paneer", "appetizers"],
  },
  {
    id: "fast_food_hub",
    name: "Fast Food Hub",
    cuisine: "Fast Food",
    rating: 3.8,
    address: "101 Pine St",
    city: "Houston",
    state: "TX",
    zip: "77001",
    menuTypes: ["fastfood", "burgers", "sides", "chicken", "drinks"],
  },
  {
    id: "cafe_corner",
    name: "Cafe Corner",
    cuisine: "Cafe",
    rating: 4.3,
    address: "222 Maple St",
    city: "Miami",
    state: "FL",
    zip: "33101",
    menuTypes: ["cafe", "coffee", "sandwiches", "pastries", "desserts"],
  },
  {
    id: "sushi_sensation",
    name: "Sushi Sensation",
    cuisine: "Japanese",
    rating: 4.6,
    address: "333 Birch St",
    city: "San Francisco",
    state: "CA",
    zip: "94101",
    menuTypes: ["japanese", "sushi", "mains", "sashimi", "soups", "ramen", "desserts"],
  },
  {
    id: "thai_taste",
    name: "Thai Taste",
    cuisine: "Thai",
    rating: 4.1,
    address: "444 Cedar St",
    city: "Seattle",
    state: "WA",
    zip: "98101",
    menuTypes: ["thai", "noodles", "curry", "soups", "rice", "appetizers", "desserts"],
  },
]

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
        name: "Chicken Fried Rice",
        description: "Wok-fried rice with chicken and vegetables",
        price: 249,
        category: "rice",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Veg Fried Rice",
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
        name: "Chicken Manchurian",
        description: "Fried chicken balls in spicy sauce",
        price: 299,
        category: "chicken",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Spring Rolls",
        description: "Crispy vegetable rolls with sweet sauce",
        price: 149,
        category: "appetizers",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop&crop=center",
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
        name: "Pasta Carbonara",
        description: "Creamy pasta with bacon and parmesan",
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
        description: "Romaine lettuce with parmesan and croutons",
        price: 199,
        category: "salads",
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
        description: "Classic Italian coffee dessert",
        price: 179,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop&crop=center",
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
        description: "Crispy golden fries with salt",
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
        description: "Crispy chicken pieces with dip",
        price: 199,
        category: "chicken",
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
        name: "Cappuccino",
        description: "Espresso with steamed milk foam",
        price: 129,
        category: "coffee",
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
        name: "Chicken Ramen",
        description: "Rich broth with noodles and chicken",
        price: 329,
        category: "ramen",
        isVegetarian: false,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop&crop=center",
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
        name: "Pad Thai",
        description: "Stir-fried noodles with tamarind sauce",
        price: 279,
        category: "noodles",
        isVegetarian: false,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1559314809-0f31657def5e?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Green Curry",
        description: "Spicy coconut curry with vegetables",
        price: 299,
        category: "curry",
        isVegetarian: true,
        isSpicy: true,
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&h=200&fit=crop&crop=center",
      },
      {
        name: "Tom Yum Soup",
        description: "Spicy and sour Thai soup",
        price: 199,
        category: "soups",
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
        description: "Sweet coconut rice with mango",
        price: 159,
        category: "desserts",
        isVegetarian: true,
        isSpicy: false,
        image: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=300&h=200&fit=crop&crop=center",
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

  const selectedMenu = menuTemplates[menuType] || menuTemplates.general
  return selectedMenu.map((item, index) => ({
    id: `${baseId}_${index + 1}`,
    ...item,
    isAvailable: true,
  }))
}

export async function GET(request: Request, { params }: { params: { placeId: string } }) {
  const { placeId } = params

  const restaurant = restaurants.find((r) => r.id === placeId)

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const menuType = searchParams.get("menuType") || "general"

  const menu = getMenuByType(menuType, restaurant.name)

  return NextResponse.json({ ...restaurant, menu })
}
