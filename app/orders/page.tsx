"use client"

import { useState, useEffect } from "react"
import { Clock, MapPin, Package, CheckCircle, RotateCcw, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import Link from "next/link"


interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  restaurantName: string
  items: OrderItem[]
  total: number
  status: "pending" | "confirmed" | "preparing" | "on_the_way" | "delivered" | "cancelled"
  createdAt: string
  estimatedDeliveryTime: string
  deliveryAddress: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching orders for user:", user?.id)

      // Pass user ID as query parameter
      const url = user?.id ? `/api/orders/user?userId=${encodeURIComponent(user.id)}` : "/api/orders/user"
      console.log("📡 Fetching from URL:", url)

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        console.log("📦 Received orders:", data.orders.length, data.orders)
        setOrders(data.orders)
      } else {
        console.error("❌ Failed to fetch orders, status:", response.status)
        const errorData = await response.json()
        console.error("❌ Error data:", errorData)
        setOrders(getEnhancedSampleOrders())
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error)
      setOrders(getEnhancedSampleOrders())
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "on_the_way":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "preparing":
        return <Package className="w-4 h-4" />
      case "on_the_way":
        return <MapPin className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <RotateCcw className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleReorder = (order: Order) => {
    // In a real app, this would add items back to cart
    alert(`Reordering from ${order.restaurantName}! (This would add items to your cart)`)
  }

  const handleTrackOrder = (orderId: string) => {
    // Navigate to order tracking page
    window.location.href = `/order-confirmation/${orderId}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your orders</h1>
          <p className="text-gray-600 mb-8">Sign in to see your order history and track current orders</p>
          <Link href="/login">
            <Button>Login to Continue</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
       

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-gray-600 mt-1">Track and manage your food orders</p>
          </div>
          <Link href="/">
            <Button className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Order More Food
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-8">When you place your first order, it will appear here.</p>
            <Link href="/">
              <Button className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Start Ordering
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {order.restaurantName}
                        {order.status === "delivered" && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Order #{order.id} •{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length}):</h4>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {order.status === "delivered" ? "Delivered" : `Est. ${order.estimatedDeliveryTime}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                      </div>
                    </div>

                    {/* Total and Actions */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div>
                        <span className="text-lg font-bold text-green-600">₹{order.total.toFixed(0)}</span>
                        <span className="text-sm text-gray-500 ml-2">Total paid</span>
                      </div>

                      <div className="flex gap-2">
                        {order.status !== "delivered" && order.status !== "cancelled" && (
                          <Button variant="outline" size="sm" onClick={() => handleTrackOrder(order.id)}>
                            Track Order
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(order)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced sample orders with more realistic data
function getEnhancedSampleOrders(): Order[] {
  return [
    {
      id: `ORD${Date.now()}001`,
      restaurantName: "Pizza Palace",
      items: [
        { id: "1", name: "Margherita Pizza", quantity: 1, price: 299 },
        { id: "2", name: "Caesar Salad", quantity: 1, price: 199 },
        { id: "3", name: "Garlic Bread", quantity: 2, price: 149 },
      ],
      total: 796, // Including delivery and tax
      status: "on_the_way",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      estimatedDeliveryTime: "10-15 min",
      deliveryAddress: "123 Main St, City, State",
    },
    {
      id: `ORD${Date.now()}002`,
      restaurantName: "Burger Junction",
      items: [
        { id: "4", name: "Classic Burger", quantity: 2, price: 199 },
        { id: "5", name: "French Fries", quantity: 1, price: 99 },
        { id: "6", name: "Chocolate Shake", quantity: 1, price: 149 },
      ],
      total: 695,
      status: "delivered",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      estimatedDeliveryTime: "Delivered",
      deliveryAddress: "123 Main St, City, State",
    },
    {
      id: `ORD${Date.now()}003`,
      restaurantName: "Biryani House",
      items: [
        { id: "7", name: "Chicken Biryani", quantity: 1, price: 329 },
        { id: "8", name: "Raita", quantity: 1, price: 79 },
      ],
      total: 457,
      status: "delivered",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      estimatedDeliveryTime: "Delivered",
      deliveryAddress: "123 Main St, City, State",
    },
    {
      id: `ORD${Date.now()}004`,
      restaurantName: "Sushi Zen",
      items: [
        { id: "9", name: "California Roll", quantity: 2, price: 299 },
        { id: "10", name: "Miso Soup", quantity: 1, price: 149 },
      ],
      total: 796,
      status: "delivered",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      estimatedDeliveryTime: "Delivered",
      deliveryAddress: "123 Main St, City, State",
    },
  ]
}

