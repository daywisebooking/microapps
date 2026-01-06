import { NextRequest, NextResponse } from "next/server"
import { setFeaturedAppSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { setFeaturedApp, clearFeaturedApp } from "@/lib/mutations"
import { verifyAdmin } from "@/lib/admin"

// GET - Get current featured app
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Note: InstantDB queries work client-side via hooks
    // For server-side, return null - client should use InstantDB hooks
    return NextResponse.json(
      { featuredApp: null },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin featured GET error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// POST - Set featured app
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

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
    const validationResult = setFeaturedAppSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const result = await setFeaturedApp(validationResult.data.appId, validationResult.data.badges)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to set featured app" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin featured POST error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// DELETE - Clear featured app
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const userType = request.headers.get("x-user-type")
    const adminCheck = await verifyAdmin(userId, userType)

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const result = await clearFeaturedApp()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to clear featured app" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin featured DELETE error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

