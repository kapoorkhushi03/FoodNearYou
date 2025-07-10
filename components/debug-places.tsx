"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugPlaces() {
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 }) // Bangalore
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const testGooglePlaces = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/restaurants/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          radius: 5000,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRestaurants(data.restaurants)
        console.log("Fetched restaurants:", data.restaurants)
      } else {
        const errorData = await response.json()
        setError(`API Error: ${errorData.error || response.statusText}`)
      }
    } catch (err) {
      setError(`Network Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          setError(`Location Error: ${error.message}`)
        },
      )
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Google Places API Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Latitude</label>
            <Input
              type="number"
              step="0.0001"
              value={location.lat}
              onChange={(e) => setLocation((prev) => ({ ...prev, lat: Number.parseFloat(e.target.value) }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Longitude</label>
            <Input
              type="number"
              step="0.0001"
              value={location.lng}
              onChange={(e) => setLocation((prev) => ({ ...prev, lng: Number.parseFloat(e.target.value) }))}
            />
          </div>
          <Button onClick={getCurrentLocation}>Use My Location</Button>
          <Button onClick={testGooglePlaces} disabled={loading}>
            {loading ? "Searching..." : "Search Restaurants"}
          </Button>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

        {restaurants.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Found {restaurants.length} restaurants:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((restaurant, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={restaurant.image || "/placeholder.svg"}
                      alt={restaurant.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{restaurant.name}</h4>
                      <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                      <p className="text-sm text-gray-500">{restaurant.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">⭐ {restaurant.rating}</span>
                        <span className="text-sm">📍 {restaurant.distance?.toFixed(1)}km</span>
                        <span className="text-sm">₹{restaurant.deliveryFee}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
