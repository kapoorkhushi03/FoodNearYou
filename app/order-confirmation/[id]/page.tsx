"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { CheckCircle, Clock, MapPin, Phone, Package, Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  createdAt: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderProgress, setOrderProgress] = useState(25)

  useEffect(() => {
    fetchOrderDetails()

    // Simulate order progress
    const progressInterval = setInterval(() => {
      setOrderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 10
      })
    }, 3000)

    return () => clearInterval(progressInterval)
  }, [params.id])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)

      // Try to fetch from API first
      const response = await fetch(`/api/orders/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        // Fallback to sample order
        const sampleOrder: OrderDetails = {
          id: params.id as string,
          restaurantName: "Pizza Palace",
          items: [
            { id: "1", name: "Margherita Pizza", quantity: 1, price: 299 },
            { id: "2", name: "Caesar Salad", quantity: 1, price: 199 },
          ],
          total: 547, // Including delivery and tax
          status: "confirmed",
          estimatedDeliveryTime: "25-35 min",
          deliveryAddress: "123 Main St, City, State",
          restaurantPhone: "+91 98765 43210",
          createdAt: new Date().toISOString(),
        }
        setOrder(sampleOrder)
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      // Set fallback order
      setOrder({
        id: params.id as string,
        restaurantName: "Restaurant",
        items: [{ id: "1", name: "Order Item", quantity: 1, price: 299 }],
        total: 348,
        status: "confirmed",
        estimatedDeliveryTime: "30-40 min",
        deliveryAddress: "Your Address",
        restaurantPhone: "+91 98765 43210",
        createdAt: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (orderProgress < 30) return <Package className="w-6 h-6 text-blue-600" />
    if (orderProgress < 70) return <Clock className="w-6 h-6 text-orange-600" />
    return <Truck className="w-6 h-6 text-green-600" />
  }

  const getStatusText = () => {
    if (orderProgress < 30) return "Order Confirmed"
    if (orderProgress < 70) return "Being Prepared"
    if (orderProgress < 100) return "Out for Delivery"
    return "Delivered"
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully! 🎉</h1>
            <p className="text-gray-600">Your delicious food is on its way</p>
          </div>

          {/* Order Progress */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <CardTitle className="text-lg">{getStatusText()}</CardTitle>
                    <p className="text-sm text-gray-600">Order #{order.id}</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Order Progress</span>
                    <span>{Math.round(orderProgress)}%</span>
                  </div>
                  <Progress value={orderProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className={`${orderProgress >= 25 ? "text-green-600" : "text-gray-400"}`}>
                    <Package className="w-5 h-5 mx-auto mb-1" />
                    <p>Confirmed</p>
                  </div>
                  <div className={`${orderProgress >= 60 ? "text-green-600" : "text-gray-400"}`}>
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    <p>Preparing</p>
                  </div>
                  <div className={`${orderProgress >= 100 ? "text-green-600" : "text-gray-400"}`}>
                    <Truck className="w-5 h-5 mx-auto mb-1" />
                    <p>Delivered</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <p className="text-gray-600">{order.restaurantName}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Items Ordered:</h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t text-lg font-bold">
                <span>Total Paid</span>
                <span className="text-green-600">₹{order.total.toFixed(0)}</span>
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
                View Order History
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Order More Food</Button>
            </Link>
          </div>

          {/* Thank You Message */}
          <div className="mt-8 text-center p-6 bg-orange-50 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Thank You for Your Order! 🙏</h3>
            <p className="text-orange-700">
              We're preparing your food with love and care. You'll receive updates about your order status.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
