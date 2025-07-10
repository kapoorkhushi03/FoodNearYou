"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { CheckCircle, Clock, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import Link from "next/link"

interface OrderDetails {
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
  estimatedDeliveryTime: string
  deliveryAddress: string
  restaurantPhone: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetails()
  }, [params.id])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      // In a real app, fetch order details from API
      // const response = await fetch(`/api/orders/${params.id}`)

      // For demo purposes, use sample data
      const sampleOrder: OrderDetails = {
        id: params.id as string,
        restaurantName: "Pizza Palace",
        items: [
          { id: "1", name: "Margherita Pizza", quantity: 1, price: 14.99 },
          { id: "2", name: "Caesar Salad", quantity: 1, price: 9.99 },
        ],
        total: 27.97,
        status: "confirmed",
        estimatedDeliveryTime: "25-35 min",
        deliveryAddress: "123 Main St, City, State",
        restaurantPhone: "(555) 123-4567",
      }

      setOrder(sampleOrder)
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Your order has been placed successfully</p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{order.id}</CardTitle>
                <Badge variant="default">Confirmed</Badge>
              </div>
              <p className="text-gray-600">{order.restaurantName}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Items:</h3>
                <div className="space-y-2">
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

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">{order.estimatedDeliveryTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Restaurant Contact</p>
                    <p className="text-sm text-gray-600">{order.restaurantPhone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                View All Orders
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
