// Simple in-memory order storage for demo purposes
// This runs only on the server side

interface StoredOrder {
  _id: string
  userId: string
  restaurantId: string
  restaurantName: string
  items: Array<{
    menuItemId: string
    name: string
    price: number
    quantity: number
  }>
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  deliveryAddress: string
  status: string
  estimatedDeliveryTime: string
  createdAt: Date
  updatedAt: Date
}

class OrderStorage {
  private orders: Map<string, StoredOrder[]> = new Map()

  addOrder(userId: string, order: StoredOrder) {
    const userOrders = this.orders.get(userId) || []
    userOrders.unshift(order) // Add to beginning for newest first
    this.orders.set(userId, userOrders)
    console.log(`📦 Stored order ${order._id} for user ${userId}`)
  }

  getUserOrders(userId: string): StoredOrder[] {
    return this.orders.get(userId) || []
  }

  getOrder(orderId: string): StoredOrder | null {
    for (const userOrders of this.orders.values()) {
      const order = userOrders.find((o) => o._id === orderId)
      if (order) return order
    }
    return null
  }

  getAllOrders(): StoredOrder[] {
    const allOrders: StoredOrder[] = []
    for (const userOrders of this.orders.values()) {
      allOrders.push(...userOrders)
    }
    return allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}

// Global instance - only create on server
let orderStorage: OrderStorage

if (typeof window === "undefined") {
  orderStorage = new OrderStorage()
}

export { orderStorage, type StoredOrder }
