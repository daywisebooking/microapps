import { NextRequest, NextResponse } from "next/server"
import { toggleUserStatusSchema } from "@/lib/validations"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"
import { toggleUserStatus } from "@/lib/mutations"
import { verifyAdmin } from "@/lib/admin"

// GET - List all users
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
    // For server-side, return empty array - client should use InstantDB hooks
    return NextResponse.json(
      { users: [] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// POST - Toggle user status (enable/disable)
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
    const validationResult = toggleUserStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { userId: targetUserId, disabled } = validationResult.data

    // Prevent disabling yourself
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: "Cannot disable your own account" },
        { status: 400 }
      )
    }

    const result = await toggleUserStatus(targetUserId, disabled)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update user status" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin users POST error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

