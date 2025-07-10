"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DebugProps {
  restaurantId: string
  isGooglePlace: boolean
  restaurant: any
}

export function RestaurantDebug({ restaurantId, isGooglePlace, restaurant }: DebugProps) {
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">🐛 Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-yellow-700">
        <div className="space-y-1">
          <p>
            <strong>Restaurant ID:</strong> {restaurantId}
          </p>
          <p>
            <strong>Is Google Place:</strong> {isGooglePlace ? "Yes" : "No"}
          </p>
          <p>
            <strong>Restaurant Name:</strong> {restaurant?.name || "Not loaded"}
          </p>
          <p>
            <strong>Menu Items:</strong> {restaurant?.menu?.length || 0}
          </p>
          <p>
            <strong>Image URL:</strong> {restaurant?.image ? "✅ Has image" : "❌ No image"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
