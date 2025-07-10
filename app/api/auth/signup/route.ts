import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import type { User } from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, address, phone } = await request.json()

    // Validate input
    if (!username || !email || !password || !address || !phone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Geocode address to get coordinates (optional)
    const coordinates = undefined
    try {
      // In production, use Google Geocoding API here
      // const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`)
      // const geocodeData = await geocodeResponse.json()
      // if (geocodeData.results[0]) {
      //   coordinates = {
      //     lat: geocodeData.results[0].geometry.location.lat,
      //     lng: geocodeData.results[0].geometry.location.lng
      //   }
      // }
    } catch (error) {
      console.log("Geocoding failed, continuing without coordinates")
    }

    // Create new user
    const newUser: User = {
      username,
      email,
      password: hashedPassword,
      address,
      phone,
      coordinates,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<User>("users").insertOne(newUser)

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.insertedId.toString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
