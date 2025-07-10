import type { ObjectId } from "mongodb"

export interface Order {
  _id?: ObjectId
  userId: ObjectId
  restaurantId: ObjectId
  restaurantName: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  status: "pending" | "confirmed" | "preparing" | "on_the_way" | "delivered" | "cancelled"
  deliveryAddress: string
  estimatedDeliveryTime: string
  actualDeliveryTime?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  menuItemId: ObjectId
  name: string
  price: number
  quantity: number
}

export interface OrderResponse {
  id: string
  restaurantName: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: string
  createdAt: string
  estimatedDeliveryTime: string
  deliveryAddress: string
}

export function transformOrder(order: Order): OrderResponse {
  return {
    id: order._id?.toString() || "",
    restaurantName: order.restaurantName,
    items: order.items.map((item) => ({
      id: item.menuItemId.toString(),
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    deliveryAddress: order.deliveryAddress,
  }
}
