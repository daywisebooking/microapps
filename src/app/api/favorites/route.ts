import { NextRequest, NextResponse } from "next/server"
import { favoriteSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { toggleFavorite } from "@/lib/mutations"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || null

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validationResult = favoriteSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { appId } = validationResult.data

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Implement favorite toggle logic with InstantDB
    const result = await toggleFavorite(userId, appId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to toggle favorite" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Favorite toggled", isFavorite: result.isFavorite },
      { status: 200 }
    )
  } catch (error) {
    console.error("Favorite error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || null

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch user favorites from InstantDB
    // Note: InstantDB React queries work client-side via hooks
    // For server-side API routes, we return empty array
    // Client-side should use useFavorites hook instead
    return NextResponse.json(
      { favorites: [] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get favorites error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

