import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  email: string
  password: string
  address: string
  phone: string
  coordinates?: {
    lat: number
    lng: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface UserResponse {
  id: string
  username: string
  email: string
  address: string
  phone: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export function transformUser(user: User): UserResponse {
  return {
    id: user._id?.toString() || "",
    username: user.username,
    email: user.email,
    address: user.address,
    phone: user.phone,
    coordinates: user.coordinates,
  }
}
