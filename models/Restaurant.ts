import type { ObjectId } from "mongodb"

export interface Restaurant {
  _id?: ObjectId
  name: string
  cuisine: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  phone: string
  rating: number
  deliveryFee: number
  deliveryTime: string
  isOpen: boolean
  imageUrl?: string
  priceRange: string
  createdAt: Date
  updatedAt: Date
}

export interface MenuItem {
  _id?: ObjectId
  restaurantId: ObjectId
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isVegetarian: boolean
  isSpicy: boolean
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RestaurantResponse {
  id: string
  name: string
  cuisine: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  phone: string
  rating: number
  deliveryFee: number
  deliveryTime: string
  isOpen: boolean
  image: string
  priceRange: string
  distance?: number
  menu?: MenuItemResponse[]
}

export interface MenuItemResponse {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isVegetarian: boolean
  isSpicy: boolean
  isAvailable: boolean
}

export function transformRestaurant(restaurant: Restaurant, distance?: number): RestaurantResponse {
  return {
    id: restaurant._id?.toString() || "",
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    address: restaurant.address,
    coordinates: restaurant.coordinates,
    phone: restaurant.phone,
    rating: restaurant.rating,
    deliveryFee: restaurant.deliveryFee,
    deliveryTime: restaurant.deliveryTime,
    isOpen: restaurant.isOpen,
    image: restaurant.imageUrl || "/placeholder.svg?height=200&width=300",
    priceRange: restaurant.priceRange,
    distance,
  }
}

export function transformMenuItem(item: MenuItem): MenuItemResponse {
  return {
    id: item._id?.toString() || "",
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.imageUrl || "/placeholder.svg?height=200&width=300",
    isVegetarian: item.isVegetarian,
    isSpicy: item.isSpicy,
    isAvailable: item.isAvailable,
  }
}
