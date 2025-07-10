"use client"

import { useState, useEffect } from "react"
import { Clock, MapPin, Package, CheckCircle } from "lucide-react"
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
  status: "pending" | "confirmed" | "preparing" | "on_the_way" | "delivered"
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
      const response = await fetch("/api/orders/user")

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        // Fallback to sample data
        setOrders(sampleOrders)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setOrders(sampleOrders)
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
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your orders</h1>
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>

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
              <Button>Start Ordering</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.restaurantName}</CardTitle>
                      <p className="text-sm text-gray-600">
                        Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}
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
                      <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Est. {order.estimatedDeliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Track Order
                      </Button>
                      <Button variant="outline" size="sm">
                        Reorder
                      </Button>
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

// Sample orders data
const sampleOrders: Order[] = [
  {
    id: "ORD001",
    restaurantName: "Pizza Palace",
    items: [
      { id: "1", name: "Margherita Pizza", quantity: 1, price: 14.99 },
      { id: "2", name: "Caesar Salad", quantity: 1, price: 9.99 },
    ],
    total: 27.97,
    status: "on_the_way",
    createdAt: new Date().toISOString(),
    estimatedDeliveryTime: "25-35 min",
    deliveryAddress: "123 Main St, City, State",
  },
  {
    id: "ORD002",
    restaurantName: "Burger Barn",
    items: [
      { id: "3", name: "Classic Burger", quantity: 2, price: 12.99 },
      { id: "4", name: "French Fries", quantity: 1, price: 4.99 },
    ],
    total: 30.97,
    status: "delivered",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    estimatedDeliveryTime: "Delivered",
    deliveryAddress: "123 Main St, City, State",
  },
]
