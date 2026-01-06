import { NextRequest, NextResponse } from "next/server"
import { writeRateLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/ratelimit"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || undefined

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, userId)
    const rateLimitResult = await checkRateLimit(writeRateLimiter(), identifier)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { eventType, appId, metadata } = body

    // Validate event type
    const validEventTypes = ["app_view", "vote", "favorite", "comment_create", "search"]
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      )
    }

    // Note: InstantDB React is client-side only
    // Events should be tracked client-side using trackEvent from lib/analytics
    // This API route provides validation and rate limiting
    // For server-side tracking, InstantDB server SDK would be needed
    console.log("Event tracked (API):", eventType, { userId, appId, metadata })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

